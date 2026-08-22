import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType
} from 'docx';
import { saveAs } from 'file-saver';

// Helper to strip HTML tags if present in descriptions
function cleanText(text?: string): string {
  if (!text) return '';
  return text.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Exports a full Resume CV to a Microsoft Word (.docx) document
 */
export async function exportResumeToWord(resumeData: any, filename?: string): Promise<void> {
  const pInfo = resumeData?.personalInfo || {};
  const experiences = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
  const education = Array.isArray(resumeData?.education) ? resumeData.education : [];
  const skills = Array.isArray(resumeData?.skills) ? resumeData.skills : [];
  const languages = Array.isArray(resumeData?.languages) ? resumeData.languages : [];
  const certifications = Array.isArray(resumeData?.certifications) ? resumeData.certifications : [];
  const customSections = Array.isArray(resumeData?.customSections) ? resumeData.customSections : [];

  const themeHex = (resumeData?.themeColor || '#1B2A4A').replace('#', '');
  const isEn = resumeData?.language === 'en';
  const isEs = resumeData?.language === 'es';

  // Section titles mapping
  const titles = resumeData?.sectionTitles || {};
  const summaryTitle = titles.summary || (isEn ? 'Professional Summary' : isEs ? 'Perfil Profesional' : 'Resumo Profissional');
  const expTitle = titles.experience || (isEn ? 'Professional Experience' : isEs ? 'Experiencia Profesional' : 'Experiência Profissional');
  const eduTitle = titles.education || (isEn ? 'Education' : isEs ? 'Educación' : 'Educação e Formação Académica');
  const certTitle = titles.certifications || (isEn ? 'Certifications & Courses' : isEs ? 'Certificaciones y Cursos' : 'Formação & Cursos');
  const skillsTitle = titles.skills || (isEn ? 'Skills & Competencies' : isEs ? 'Habilidades y Competencias' : 'Competências & Habilidades');
  const langTitle = titles.languages || (isEn ? 'Languages' : isEs ? 'Idiomas' : 'Idiomas');

  const children: any[] = [];

  // --- HEADER: Name & Title ---
  if (pInfo.fullName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: pInfo.fullName.toUpperCase(),
            bold: true,
            size: 36, // 18pt
            color: themeHex,
            font: 'Calibri'
          })
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 100 }
      })
    );
  }

  if (pInfo.title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: pInfo.title,
            bold: true,
            size: 24, // 12pt
            color: '555555',
            font: 'Calibri'
          })
        ],
        spacing: { after: 150 }
      })
    );
  }

  // Contact Info Line
  const contactParts: string[] = [];
  if (pInfo.email) contactParts.push(`Email: ${pInfo.email}`);
  if (pInfo.phone) contactParts.push(`Tel: ${pInfo.phone}`);
  if (pInfo.location) contactParts.push(`Local: ${pInfo.location}`);
  if (pInfo.website) contactParts.push(`Site/LinkedIn: ${pInfo.website}`);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: 19, // 9.5pt
            color: '666666',
            font: 'Calibri'
          })
        ],
        spacing: { after: 250 }
      })
    );
  }

  // Helper for Section Heading
  const addSectionHeader = (titleText: string) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: titleText.toUpperCase(),
            bold: true,
            size: 24, // 12pt
            color: themeHex,
            font: 'Calibri'
          })
        ],
        border: {
          bottom: {
            color: themeHex,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 12
          }
        },
        spacing: {
          before: 300,
          after: 150
        }
      })
    );
  };

  // --- SUMMARY ---
  if (pInfo.summary) {
    addSectionHeader(summaryTitle);
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cleanText(pInfo.summary),
            size: 22, // 11pt
            font: 'Calibri'
          })
        ],
        spacing: { after: 200 }
      })
    );
  }

  // --- EXPERIENCE ---
  if (experiences.length > 0) {
    addSectionHeader(expTitle);
    experiences.forEach((exp: any) => {
      const dates = [exp.startDate, exp.endDate || (exp.current ? (isEn ? 'Present' : 'Presente') : '')].filter(Boolean).join(' - ');
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.position || '',
              bold: true,
              size: 22,
              font: 'Calibri',
              color: '222222'
            }),
            new TextRun({
              text: exp.company ? ` | ${exp.company}` : '',
              bold: true,
              size: 22,
              font: 'Calibri',
              color: themeHex
            }),
            new TextRun({
              text: dates ? `  (${dates})` : '',
              italics: true,
              size: 20,
              font: 'Calibri',
              color: '666666'
            })
          ],
          spacing: {
            before: 120,
            after: 60
          }
        })
      );

      if (exp.description) {
        const descLines = cleanText(exp.description).split('\n').filter(Boolean);
        descLines.forEach((line) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
          if (cleanLine) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: cleanLine,
                    size: 21,
                    font: 'Calibri'
                  })
                ],
                spacing: { after: 40 }
              })
            );
          }
        });
      }
    });
  }

  // --- EDUCATION ---
  if (education.length > 0) {
    addSectionHeader(eduTitle);
    education.forEach((edu: any) => {
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree || edu.field || '',
              bold: true,
              size: 22,
              font: 'Calibri',
              color: '222222'
            }),
            new TextRun({
              text: edu.institution ? ` | ${edu.institution}` : '',
              size: 22,
              font: 'Calibri',
              color: themeHex
            }),
            new TextRun({
              text: dates ? ` (${dates})` : '',
              italics: true,
              size: 20,
              font: 'Calibri',
              color: '666666'
            })
          ],
          spacing: {
            before: 120,
            after: 60
          }
        })
      );

      if (edu.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(edu.description),
                size: 21,
                font: 'Calibri'
              })
            ],
            spacing: { after: 100 }
          })
        );
      }
    });
  }

  // --- CERTIFICATIONS & COURSES ---
  if (certifications.length > 0) {
    addSectionHeader(certTitle);
    certifications.forEach((cert: any) => {
      const lineText = [cert.name, cert.issuer, cert.date].filter(Boolean).join(' - ');
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: lineText,
              bold: true,
              size: 21,
              font: 'Calibri'
            }),
            cert.description ? new TextRun({
              text: `: ${cleanText(cert.description)}`,
              size: 21,
              font: 'Calibri'
            }) : new TextRun({ text: '' })
          ],
          spacing: { after: 60 }
        })
      );
    });
  }

  // --- SKILLS ---
  if (skills.length > 0) {
    addSectionHeader(skillsTitle);
    const skillStrings = skills.map((s: any) => typeof s === 'string' ? s : (s.name + (s.level ? ` (${s.level})` : '')));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: skillStrings.join('  •  '),
            size: 22,
            font: 'Calibri'
          })
        ],
        spacing: { after: 150 }
      })
    );
  }

  // --- LANGUAGES ---
  if (languages.length > 0) {
    addSectionHeader(langTitle);
    const langStrings = languages.map((l: any) => typeof l === 'string' ? l : (l.name + (l.level ? ` (${l.level})` : '')));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: langStrings.join('  •  '),
            size: 22,
            font: 'Calibri'
          })
        ],
        spacing: { after: 150 }
      })
    );
  }

  // --- CUSTOM SECTIONS ---
  if (customSections.length > 0) {
    customSections.forEach((cs: any) => {
      if (!cs || !cs.title) return;
      addSectionHeader(cs.title);
      if (Array.isArray(cs.items)) {
        cs.items.forEach((item: any) => {
          const nameStr = typeof item === 'string' ? item : item.name;
          const descStr = typeof item === 'object' ? item.description : '';
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: nameStr || '',
                  bold: true,
                  size: 21,
                  font: 'Calibri'
                }),
                descStr ? new TextRun({
                  text: `: ${cleanText(descStr)}`,
                  size: 21,
                  font: 'Calibri'
                }) : new TextRun({ text: '' })
              ],
              spacing: { after: 60 }
            })
          );
        });
      }
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000
            }
          }
        },
        children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const outName = filename || `Curriculo_${pInfo.fullName ? pInfo.fullName.replace(/\s+/g, '_') : 'Candidato'}.docx`;
  saveAs(blob, outName);
}

/**
 * Exports a Cover Letter to a Microsoft Word (.docx) document
 */
export async function exportCoverLetterToWord(options: {
  content: string;
  personalInfo: any;
  subject?: string;
  companyInfo?: {
    companyName?: string;
    recipientName?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
  themeColor?: string;
  filename?: string;
}): Promise<void> {
  const { content, personalInfo = {}, subject, companyInfo = {}, themeColor = '#1B2A4A', filename } = options;
  const themeHex = themeColor.replace('#', '');

  const children: any[] = [];

  // Candidate Name & Title
  if (personalInfo.fullName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: personalInfo.fullName.toUpperCase(),
            bold: true,
            size: 32,
            color: themeHex,
            font: 'Calibri'
          })
        ],
        spacing: { after: 80 }
      })
    );
  }

  if (personalInfo.title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: personalInfo.title,
            size: 22,
            color: '666666',
            font: 'Calibri'
          })
        ],
        spacing: { after: 120 }
      })
    );
  }

  // Candidate Contacts
  const contacts: string[] = [];
  if (personalInfo.email) contacts.push(`Email: ${personalInfo.email}`);
  if (personalInfo.phone) contacts.push(`Tel: ${personalInfo.phone}`);
  if (personalInfo.location) contacts.push(`Local: ${personalInfo.location}`);

  if (contacts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contacts.join('  |  '),
            size: 19,
            color: '777777',
            font: 'Calibri'
          })
        ],
        spacing: { after: 300 }
      })
    );
  }

  // --- RECIPIENT / COMPANY BOX ---
  if (companyInfo.companyName || companyInfo.recipientName || companyInfo.companyPhone || companyInfo.companyEmail) {
    const compRows: TableRow[] = [];

    const compCells: TableCell[] = [];
    const compDetails: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'PARA / DESTINATÁRIO:',
            bold: true,
            size: 18,
            color: '888888',
            font: 'Calibri'
          })
        ],
        spacing: { after: 60 }
      })
    ];

    if (companyInfo.recipientName) {
      compDetails.push(
        new Paragraph({
          children: [
            new TextRun({
              text: companyInfo.recipientName,
              bold: true,
              size: 22,
              font: 'Calibri'
            })
          ],
          spacing: { after: 40 }
        })
      );
    }

    if (companyInfo.companyName) {
      compDetails.push(
        new Paragraph({
          children: [
            new TextRun({
              text: companyInfo.companyName,
              bold: true,
              size: 22,
              color: themeHex,
              font: 'Calibri'
            })
          ],
          spacing: { after: 40 }
        })
      );
    }

    const companyContactParts: string[] = [];
    if (companyInfo.companyPhone) companyContactParts.push(`Tel: ${companyInfo.companyPhone}`);
    if (companyInfo.companyEmail) companyContactParts.push(`Email: ${companyInfo.companyEmail}`);

    if (companyContactParts.length > 0) {
      compDetails.push(
        new Paragraph({
          children: [
            new TextRun({
              text: companyContactParts.join('  |  '),
              size: 19,
              color: '666666',
              font: 'Calibri'
            })
          ]
        })
      );
    }

    compCells.push(
      new TableCell({
        children: compDetails,
        shading: { fill: 'F8FAFC' },
        margins: { top: 150, bottom: 150, left: 200, right: 200 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
          left: { style: BorderStyle.SINGLE, size: 12, color: themeHex },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' }
        }
      })
    );

    compRows.push(new TableRow({ children: compCells }));

    children.push(
      new Table({
        rows: compRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      })
    );

    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // --- SUBJECT LINE ---
  if (subject) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'ASSUNTO: ',
            bold: true,
            size: 22,
            color: '666666',
            font: 'Calibri'
          }),
          new TextRun({
            text: subject,
            bold: true,
            size: 22,
            color: '111111',
            font: 'Calibri'
          })
        ],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' }
        },
        spacing: {
          before: 150,
          after: 250
        }
      })
    );
  }

  // --- LETTER BODY ---
  const paragraphs = content.split('\n\n').filter(Boolean);
  paragraphs.forEach((pText) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: pText.trim(),
            size: 22, // 11pt
            font: 'Calibri'
          })
        ],
        spacing: { after: 200, line: 276 }
      })
    );
  });

  // --- SIGN OFF ---
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Com os melhores cumprimentos,',
          size: 22,
          font: 'Calibri'
        })
      ],
      spacing: {
        before: 300,
        after: 150
      }
    })
  );

  if (personalInfo.fullName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: personalInfo.fullName,
            bold: true,
            size: 22,
            color: themeHex,
            font: 'Calibri'
          })
        ]
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000
            }
          }
        },
        children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const outName = filename || `Carta_Apresentacao_${personalInfo.fullName ? personalInfo.fullName.replace(/\s+/g, '_') : 'Candidato'}.docx`;
  saveAs(blob, outName);
}
