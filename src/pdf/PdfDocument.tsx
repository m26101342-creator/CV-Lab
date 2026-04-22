import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font, Image, Svg, Path } from '@react-pdf/renderer';
import { ResumeData } from '../types';

// Register Fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/gh/rsms/inter@master/fonts/ttf/Inter-Regular.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/gh/rsms/inter@master/fonts/ttf/Inter-Italic.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/gh/rsms/inter@master/fonts/ttf/Inter-Bold.ttf', fontWeight: 700 },
    { src: 'https://cdn.jsdelivr.net/gh/rsms/inter@master/fonts/ttf/Inter-BoldItalic.ttf', fontWeight: 700, fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/gh/rsms/inter@master/fonts/ttf/Inter-Black.ttf', fontWeight: 900 },
    { src: 'https://cdn.jsdelivr.net/gh/rsms/inter@master/fonts/ttf/Inter-BlackItalic.ttf', fontWeight: 900, fontStyle: 'italic' }
  ]
});

// Common Styles
const commonStyles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.5,
    padding: 0,
    backgroundColor: '#FFFFFF',
    color: '#374151'
  },
  bold: { fontWeight: 700 },
  black: { fontWeight: 900 },
  italic: { fontStyle: 'italic' }
});

// Icons as SVG components for crisper rendering
const Icons = {
  Mail: () => (
    <Svg key="mail-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect key="r1" width="20" height="16" x="2" y="4" rx="2" />
      <path key="p1" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
  ),
  Phone: () => (
    <Svg key="phone-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path key="p1" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  ),
  MapPin: () => (
    <Svg key="map-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path key="p1" d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle key="c1" cx="12" cy="10" r="3" />
    </Svg>
  )
};

const Template1 = ({ data }: { data: ResumeData }) => {
  const styles = StyleSheet.create({
    container: { flexDirection: 'row', height: '100%' },
    leftCol: { width: '35%', backgroundColor: '#1B2A4A', color: 'white', padding: 30 },
    rightCol: { width: '65%', padding: 40, backgroundColor: 'white' },
    avatar: { width: 120, height: 120, marginBottom: 20, alignSelf: 'center' },
    avatarText: { width: 120, height: 120, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, alignSelf: 'center' },
    sectionTitle: { fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 5 },
    contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    contactText: { fontSize: 9 },
    skillItem: { backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 4, marginBottom: 5, fontSize: 9 },
    name: { fontSize: 32, fontWeight: 900, color: '#1B2A4A', marginBottom: 4 },
    title: { fontSize: 14, fontWeight: 700, color: '#1B2A4A', opacity: 0.8, marginBottom: 15 },
    divider: { height: 3, width: 40, backgroundColor: '#1B2A4A', marginBottom: 20 },
    summary: { fontSize: 10, lineHeight: 1.6, marginBottom: 30 },
    mainSectionTitle: { fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: '#1B2A4A', marginBottom: 15 },
    expItem: { marginBottom: 20, flexDirection: 'row' },
    expLine: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 10, height: '100%' },
    expDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1B2A4A', position: 'absolute', left: -3, top: 4 },
    expContent: { flex: 1 },
    expRole: { fontSize: 11, fontWeight: 700 },
    expPeriod: { fontSize: 8, color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase' },
    expDesc: { fontSize: 10, marginTop: 5, lineHeight: 1.5 }
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        {data.personalInfo.photo ? (
          <Image src={data.personalInfo.photo} style={[styles.avatar, { borderRadius: data.personalInfo.photoStyle === 'circle' ? 60 : 10 }]} />
        ) : (
          <View style={styles.avatarText}>
            <Text style={{ fontSize: 40, fontWeight: 900 }}>{data.personalInfo.fullName.charAt(0)}</Text>
          </View>
        )}

        <View style={{ marginBottom: 30 }}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <View style={styles.contactRow}><Icons.Mail /><Text style={styles.contactText}>{data.personalInfo.email}</Text></View>
          <View style={styles.contactRow}><Icons.Phone /><Text style={styles.contactText}>{data.personalInfo.phone}</Text></View>
          <View style={styles.contactRow}><Icons.MapPin /><Text style={styles.contactText}>{data.personalInfo.location}</Text></View>
        </View>

        {data.skills.length > 0 && (
          <View style={{ marginBottom: 30 }}>
            <Text style={styles.sectionTitle}>Habilidades</Text>
            {data.skills.map((s, idx) => (
              <View key={s.id || `skill-${idx}`} style={styles.skillItem}><Text>{s.name}</Text></View>
            ))}
          </View>
        )}

        {data.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Educação</Text>
            {data.education.map((e, idx) => (
              <View key={e.id || `edu-${idx}`} style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 10, fontWeight: 700 }}>{e.degree}</Text>
                <Text style={{ fontSize: 9 }}>{e.institution}</Text>
                <Text style={{ fontSize: 8, opacity: 0.6 }}>{e.startDate} - {e.endDate}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.rightCol}>
        <Text style={styles.name}>{data.personalInfo.fullName}</Text>
        <Text style={styles.title}>{data.personalInfo.title}</Text>
        <View style={styles.divider} />
        <Text style={styles.summary}>{data.personalInfo.summary.replace(/\*/g, '')}</Text>

        {data.experience.length > 0 && (
          <View>
            <Text style={styles.mainSectionTitle}>Experiência Profissional</Text>
            {data.experience.map((ex, idx) => (
              <View key={ex.id || `exp-${idx}`} style={styles.expItem}>
                <View style={styles.expContent}>
                  <Text style={styles.expRole}>{ex.position} | <Text style={{ color: '#4B5563' }}>{ex.company}</Text></Text>
                  <Text style={styles.expPeriod}>{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</Text>
                  <Text style={styles.expDesc}>{ex.description.replace(/\*/g, '')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const Template2 = ({ data }: { data: ResumeData }) => {
  const styles = StyleSheet.create({
    page: { padding: 0, backgroundColor: 'white' },
    header: { backgroundColor: '#1B2A4A', padding: 40, color: 'white', flexDirection: 'row' },
    avatar: { width: 100, height: 100, borderRadius: 50, marginRight: 30 },
    headerText: { flex: 1 },
    name: { fontSize: 32, fontWeight: 900, marginBottom: 5 },
    title: { fontSize: 14, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' },
    divider: { height: 2, width: 30, backgroundColor: 'white', marginVertical: 15 },
    body: { padding: 40, flexDirection: 'row' },
    leftCol: { width: '35%', paddingRight: 30 },
    rightCol: { width: '65%' },
    sectionTitle: { fontSize: 13, fontWeight: 900, textTransform: 'uppercase', borderBottom: '1px solid #1B2A4A', paddingBottom: 5, marginBottom: 15, color: '#1B2A4A' },
    contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    skillTag: { border: '1px solid #E5E7EB', padding: '4px 8px', borderRadius: 4, marginRight: 5, marginBottom: 5, fontSize: 9 }
  });

  return (
    <View key="t2-root">
      <View key="t2-header" style={styles.header}>
        {data.personalInfo.photo && <Image key="photo" src={data.personalInfo.photo} style={styles.avatar} />}
        <View key="header-text" style={styles.headerText}>
          <Text style={styles.name}>{data.personalInfo.fullName}</Text>
          <Text style={styles.title}>{data.personalInfo.title}</Text>
          <View style={styles.divider} />
          <Text style={{ fontSize: 10, lineHeight: 1.5 }}>{data.personalInfo.summary.replace(/\*/g, '')}</Text>
        </View>
      </View>
      <View key="t2-body" style={styles.body}>
        <View key="left-col" style={styles.leftCol}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <View key="c-mail" style={styles.contactItem}><Icons.Mail /><Text>{data.personalInfo.email}</Text></View>
          <View key="c-phone" style={styles.contactItem}><Icons.Phone /><Text>{data.personalInfo.phone}</Text></View>
          <View key="c-loc" style={styles.contactItem}><Icons.MapPin /><Text>{data.personalInfo.location}</Text></View>

          {data.skills.length > 0 && (
            <View key="skills-section" style={{ marginTop: 30 }}>
              <Text style={styles.sectionTitle}>Habilidades</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {data.skills.map((s, idx) => <View key={s.id || `skill-${idx}`} style={styles.skillTag}><Text>{s.name}</Text></View>)}
              </View>
            </View>
          )}
        </View>
        <View key="right-col" style={styles.rightCol}>
          <Text style={styles.sectionTitle}>Experiência</Text>
          {data.experience.map((ex, idx) => (
            <View key={ex.id || `exp-${idx}`} style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: 700 }}>{ex.position}</Text>
              <Text style={{ fontSize: 10, color: '#1B2A4A', fontWeight: 900 }}>{ex.company}</Text>
              <Text style={{ fontSize: 8, color: '#9CA3AF', marginVertical: 4 }}>{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</Text>
              <Text style={{ fontSize: 10 }}>{ex.description.replace(/\*/g, '')}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const Template3 = ({ data }: { data: ResumeData }) => {
  const styles = StyleSheet.create({
    header: { padding: 40, borderBottom: '1px solid #E5E7EB', alignItems: 'center' },
    name: { fontSize: 36, fontWeight: 900, color: '#1B2A4A' },
    title: { fontSize: 14, fontWeight: 700, color: '#1B2A4A', textTransform: 'uppercase', letterSpacing: 2, marginTop: 5 },
    contactRow: { flexDirection: 'row', gap: 20, marginTop: 15, justifyContent: 'center' },
    contactItem: { flexDirection: 'row', alignItems: 'center', gap: 5, fontSize: 9 },
    body: { padding: 40, flexDirection: 'row' },
    leftCol: { width: '35%', paddingRight: 30 },
    rightCol: { width: '65%' },
    sectionTitle: { fontSize: 11, fontWeight: 900, textTransform: 'uppercase', backgroundColor: '#F3F4F6', padding: '5px 10px', marginBottom: 15, color: '#1B2A4A' }
  });

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.name}>{data.personalInfo.fullName}</Text>
        <Text style={styles.title}>{data.personalInfo.title}</Text>
        <View style={styles.contactRow}>
          <View style={styles.contactItem}><Icons.Mail /><Text>{data.personalInfo.email}</Text></View>
          <View style={styles.contactItem}><Icons.Phone /><Text>{data.personalInfo.phone}</Text></View>
          <View style={styles.contactItem}><Icons.MapPin /><Text>{data.personalInfo.location}</Text></View>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.leftCol}>
          {data.education.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Formação</Text>
              {data.education.map((e, idx) => (
                <View key={e.id || `edu-${idx}`} style={{ marginBottom: 15 }}>
                  <Text style={{ fontWeight: 700, fontSize: 10 }}>{e.institution}</Text>
                  <Text style={{ fontSize: 9 }}>{e.degree}</Text>
                  <Text style={{ fontSize: 8, color: '#9CA3AF' }}>{e.startDate} - {e.endDate}</Text>
                </View>
              ))}
            </View>
          )}
          {data.skills.length > 0 && (
            <View style={{ marginTop: 30 }}>
              <Text style={styles.sectionTitle}>Habilidades</Text>
              {data.skills.map((s, idx) => <Text key={s.id || `skill-${idx}`} style={{ fontSize: 10, marginBottom: 5 }}>• {s.name}</Text>)}
            </View>
          )}
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.sectionTitle}>Sobre Mim</Text>
          <Text style={{ fontSize: 10, marginBottom: 30, lineHeight: 1.6 }}>{data.personalInfo.summary.replace(/\*/g, '')}</Text>
          <Text style={styles.sectionTitle}>Experiência</Text>
          {data.experience.map((ex, idx) => (
            <View key={ex.id || `exp-${idx}`} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 700 }}>{ex.position}</Text>
                <Text style={{ fontSize: 8, color: '#9CA3AF' }}>{ex.startDate} - {ex.endDate}</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#1B2A4A', marginBottom: 5 }}>{ex.company}</Text>
              <Text style={{ fontSize: 10 }}>{ex.description.replace(/\*/g, '')}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const Template4 = ({ data }: { data: ResumeData }) => {
  const styles = StyleSheet.create({
    container: { flexDirection: 'row', height: '100%' },
    sidebar: { width: '32%', backgroundColor: '#2D313A', color: 'white', padding: 30 },
    main: { width: '68%', padding: 40 },
    photo: { width: '100%', height: 250, alignSelf: 'center', marginBottom: 20, objectFit: 'cover' },
    sidebarTitle: { fontSize: 18, fontWeight: 900, marginBottom: 5 },
    sidebarLogo: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 30 },
    sectionHeading: { fontSize: 24, fontWeight: 900, marginBottom: 10 },
    decorationBar: { height: 6, width: 40, backgroundColor: '#E5E7EB', marginBottom: 20, borderRadius: 3 }
  });

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        {data.personalInfo.photo && <Image src={data.personalInfo.photo} style={styles.photo} />}
        <Text style={styles.sidebarTitle}>{data.personalInfo.fullName.replace(' ', '\n')}</Text>
        <Text style={styles.sidebarLogo}>{data.personalInfo.title}</Text>
        <View style={{ marginTop: 40 }}>
          <Text style={{ fontWeight: 700, marginBottom: 15, borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: 5 }}>Contacto</Text>
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 9 }}>{data.personalInfo.email}</Text>
            <Text style={{ fontSize: 9 }}>{data.personalInfo.phone}</Text>
            <Text style={{ fontSize: 9 }}>{data.personalInfo.location}</Text>
          </View>
        </View>
      </View>
      <View style={styles.main}>
        <Text style={styles.sectionHeading}>Perfil</Text>
        <View style={styles.decorationBar} />
        <Text style={{ fontSize: 11, lineHeight: 1.8, marginBottom: 40 }}>{data.personalInfo.summary.replace(/\*/g, '')}</Text>

        <Text style={styles.sectionHeading}>Experiência</Text>
        <View style={styles.decorationBar} />
        {data.experience.map((ex, idx) => (
          <View key={ex.id || `exp-${idx}`} style={{ marginBottom: 25 }}>
            <Text style={{ fontSize: 13, fontWeight: 700 }}>{ex.position}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#4B5563' }}>{ex.company}</Text>
              <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{ex.startDate} - {ex.endDate}</Text>
            </View>
            <Text style={{ fontSize: 11, lineHeight: 1.6 }}>{ex.description.replace(/\*/g, '')}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const Template5 = ({ data }: { data: ResumeData }) => {
  const styles = StyleSheet.create({
    container: { flexDirection: 'row', height: '100%' },
    sidebar: { width: '34%', backgroundColor: '#F3F4F6', padding: 30, alignItems: 'center' },
    main: { width: '66%', padding: 40 },
    photo: { width: 140, height: 140, borderRadius: 70, border: '5pt solid white', marginBottom: 30 },
    sidebarSection: { width: '100%', marginBottom: 30 },
    sidebarTitle: { fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: '#4A4C53', borderBottom: '2px solid rgba(74,76,83,0.2)', paddingBottom: 5, marginBottom: 15 },
    name: { fontSize: 40, fontWeight: 900, color: '#4A4C53', marginBottom: 10 },
    title: { fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 4, color: '#4A4C53', opacity: 0.8 },
    mainSection: { marginBottom: 30 },
    mainTitle: { fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 15, borderBottom: '1px solid #F3F4F6', paddingBottom: 10 }
  });

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        {data.personalInfo.photo && <Image src={data.personalInfo.photo} style={styles.photo} />}
        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarTitle}>Contacto</Text>
          <Text style={{ fontSize: 10, marginBottom: 10 }}>{data.personalInfo.email}</Text>
          <Text style={{ fontSize: 10, marginBottom: 10 }}>{data.personalInfo.phone}</Text>
          <Text style={{ fontSize: 10 }}>{data.personalInfo.location}</Text>
        </View>
        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarTitle}>Educação</Text>
          {data.education.map((e, idx) => (
            <View key={e.id || `edu-${idx}`} style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#4A4C53' }}>{e.institution}</Text>
              <Text style={{ fontSize: 10 }}>{e.degree}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.main}>
        <Text style={styles.name}>{data.personalInfo.fullName.split(' ')[0]}</Text>
        <Text style={[styles.name, { fontWeight: 400, marginTop: -10 }]}>{data.personalInfo.fullName.split(' ').slice(1).join(' ')}</Text>
        <Text style={styles.title}>{data.personalInfo.title}</Text>
        
        <View style={{ marginTop: 40 }}>
          <Text style={styles.mainTitle}>Perfil</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.8, marginBottom: 30 }}>{data.personalInfo.summary.replace(/\*/g, '')}</Text>
          <Text style={styles.mainTitle}>Experiência</Text>
          {data.experience.map((ex, idx) => (
            <View key={ex.id || `exp-${idx}`} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontWeight: 900, fontSize: 12 }}>{ex.position}</Text>
                <Text style={{ fontSize: 8, backgroundColor: '#F3F4F6', padding: '2px 8px', borderRadius: 4 }}>{ex.startDate} - {ex.endDate}</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#4A4C53', marginBottom: 5 }}>{ex.company}</Text>
              <Text style={{ fontSize: 10, lineHeight: 1.5 }}>{ex.description.replace(/\*/g, '')}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const CoverLetter = ({ data }: { data: any }) => {
  const styles = StyleSheet.create({
    container: { padding: 50, flex: 1 },
    header: { marginBottom: 30, borderBottom: '1pt solid #E5E7EB', paddingBottom: 20 },
    name: { fontSize: 24, fontWeight: 900, color: '#1B2A4A', marginBottom: 4 },
    title: { fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 },
    contactRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: -35 },
    contactText: { fontSize: 9, color: '#4B5563' },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, marginTop: 40, fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' },
    content: { fontSize: 12, lineHeight: 1.8, color: '#374151', textAlign: 'justify' },
    footer: { marginTop: 60, alignItems: 'flex-end' },
    signature: { fontSize: 14, fontWeight: 900, color: '#1B2A4A', marginTop: 10, fontStyle: 'italic' }
  });

  const info = data.personalInfo || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{info.fullName || 'Seu Nome'}</Text>
          <Text style={styles.title}>{info.title || 'Seu Cargo'}</Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactText}>{info.email}</Text>
          <Text style={styles.contactText}>{info.phone}</Text>
        </View>
      </View>

      <View style={styles.dateRow}>
        <Text>Ref: Candidatura Espontânea</Text>
        <Text>Luanda, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
      </View>

      <Text style={styles.content}>
        {data.content ? data.content.replace(/\*/g, '') : ''}
      </Text>

      <View style={styles.footer}>
        <Text style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 5 }}>Atentamente,</Text>
        <Text style={styles.signature}>{info.fullName || 'Seu Nome'}</Text>
      </View>
    </View>
  );
};

export const PdfDocument = ({ data, templateId, type = 'resume' }: { data: any; templateId: number; type?: 'resume' | 'cover_letter' }) => (
  <Document title={type === 'resume' ? 'Currículo CV LAB' : 'Carta de Apresentação CV LAB'}>
    <Page size="A4" style={commonStyles.page} dpi={72}>
      {type === 'resume' ? (
        <>
          {templateId === 1 && <Template1 key="t1" data={data} />}
          {templateId === 2 && <Template2 key="t2" data={data} />}
          {templateId === 3 && <Template3 key="t3" data={data} />}
          {templateId === 4 && <Template4 key="t4" data={data} />}
          {templateId === 5 && <Template5 key="t5" data={data} />}
        </>
      ) : (
        <CoverLetter data={data} />
      )}
    </Page>
  </Document>
);
