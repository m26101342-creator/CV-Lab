import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font, Image, Svg, Path } from '@react-pdf/renderer';
import { ResumeData } from '../types';

const getSectionTitle = (data: ResumeData, key: keyof NonNullable<ResumeData['sectionTitles']>, defaultTitle: string) => {
  return data.sectionTitles?.[key] || defaultTitle;
};

const RenderCustomSections = ({ 
  customSections, 
  headingStyle, 
  itemTitleStyle = { fontSize: 9.5, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 }, 
  itemDescStyle = { fontSize: 8.5, color: '#4B5563', marginTop: 3, lineHeight: 1.35 },
  cardStyle = null
}: { 
  customSections?: any[], 
  headingStyle: any, 
  itemTitleStyle?: any, 
  itemDescStyle?: any,
  cardStyle?: any
}) => {
  if (!customSections || customSections.length === 0) return null;
  return (
    <>
      {customSections.map((cs, idx) => {
        const content = (
          <View key={cs.id || `cs-${idx}`} style={{ marginBottom: 15, marginTop: 10 }}>
            <Text style={headingStyle}>{cs.title}</Text>
            <View style={{ gap: 5 }}>
              {cs.items.map((item: any, idxx: number) => (
                <View key={item.id || `csi-${idxx}`} style={{ marginBottom: 4 }}>
                  <Text style={itemTitleStyle}>{item.name}</Text>
                  {item.description ? (
                    <Text style={itemDescStyle}>{item.description.replace(/\*/g, '')}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        );

        if (cardStyle) {
          return (
            <View key={cs.id || `cs-${idx}`} style={cardStyle}>
              {content}
            </View>
          );
        }
        return content;
      })}
    </>
  );
};

// Register Fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-italic.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf', fontWeight: 700 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-italic.ttf', fontWeight: 700, fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-900-normal.ttf', fontWeight: 900 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-900-italic.ttf', fontWeight: 900, fontStyle: 'italic' }
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
    <Svg key="mail-svg" style={{ marginRight: 4, alignSelf: 'center' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect key="r1" width="20" height="16" x="2" y="4" rx="2" />
      <path key="p1" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
  ),
  Phone: () => (
    <Svg key="phone-svg" style={{ marginRight: 4, alignSelf: 'center' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path key="p1" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  ),
  MapPin: () => (
    <Svg key="map-svg" style={{ marginRight: 4, alignSelf: 'center' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path key="p1" d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle key="c1" cx="12" cy="10" r="3" />
    </Svg>
  )
};

const Template1 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#1B2A4A';
  const styles = StyleSheet.create({
    container: { flexDirection: 'row', height: '100%' },
    leftCol: { width: '35%', backgroundColor: cTheme, color: 'white', padding: 30 },
    rightCol: { width: '65%', padding: 40, backgroundColor: 'white' },
    avatar: { width: 120, height: 120, marginBottom: 20, alignSelf: 'center' },
    avatarText: { width: 120, height: 120, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, alignSelf: 'center' },
    sectionTitle: { fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 5 },
    contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    contactText: { fontSize: 9 },
    skillItem: { backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: 4, marginBottom: 5 },
    skillText: { fontSize: 9, color: '#FFFFFF' },
    name: { fontSize: 32, fontWeight: 900, color: cTheme, marginBottom: 6, lineHeight: 1.15 },
    title: { fontSize: 14, fontWeight: 700, color: '#4B5563', marginBottom: 15 },
    divider: { height: 3, width: 40, backgroundColor: cTheme, marginBottom: 20 },
    summary: { fontSize: 10, lineHeight: 1.6, marginBottom: 30 },
    mainSectionTitle: { fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: cTheme, marginBottom: 15 },
    expItem: { marginBottom: 20, flexDirection: 'row' },
    expLine: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 10, height: '100%' },
    expDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: cTheme, position: 'absolute', left: -3, top: 4 },
    expContent: { flex: 1 },
    expRole: { fontSize: 11, fontWeight: 700 },
    expPeriod: { fontSize: 8, color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase' },
    expDesc: { fontSize: 10, marginTop: 5, lineHeight: 1.5 }
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        {data.styleConfig?.showPhoto !== false && (
          data.personalInfo.photo ? (
            <Image src={data.personalInfo.photo} style={[styles.avatar, { borderRadius: data.personalInfo.photoStyle === 'circle' ? 60 : 10 }]} />
          ) : (
            <View style={styles.avatarText}>
              <Text style={{ fontSize: 40, fontWeight: 900 }}>{data.personalInfo.fullName.charAt(0)}</Text>
            </View>
          )
        )}

        <View style={{ marginBottom: 30 }}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <View style={styles.contactRow}><Icons.Mail /><Text style={styles.contactText}>{data.personalInfo.email}</Text></View>
          <View style={styles.contactRow}><Icons.Phone /><Text style={styles.contactText}>{data.personalInfo.phone}</Text></View>
          <View style={styles.contactRow}><Icons.MapPin /><Text style={styles.contactText}>{data.personalInfo.location}</Text></View>
        </View>

        {data.skills.length > 0 && (
          <View style={{ marginBottom: 30 }}>
            <Text style={styles.sectionTitle}>{getSectionTitle(data, 'skills', 'Habilidades')}</Text>
            {data.skills.filter(s => s?.name && s.name.trim() !== '').map((s, idx) => (
              <View key={s.id || `skill-${idx}`} style={styles.skillItem}>
                <Text style={styles.skillText}>{s.name.trim()}</Text>
              </View>
            ))}
          </View>
        )}

        {data.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{getSectionTitle(data, 'education', 'Educação')}</Text>
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
            <Text style={styles.mainSectionTitle}>{getSectionTitle(data, 'experience', 'Experiência Profissional')}</Text>
            {data.experience.map((ex, idx) => (
              <View key={ex.id || `exp-${idx}`} style={[styles.expItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }]}>
                <View style={styles.expContent}>
                  <Text style={styles.expRole}>{ex.position} | <Text style={{ color: '#4B5563' }}>{ex.company}</Text></Text>
                  <Text style={styles.expPeriod}>{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</Text>
                  <Text style={styles.expDesc}>{ex.description.replace(/\*/g, '')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <RenderCustomSections customSections={data.customSections} headingStyle={styles.mainSectionTitle} />
      </View>
    </View>
  );
};

const Template2 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#1B2A4A';
  const styles = StyleSheet.create({
    page: { padding: 0, backgroundColor: 'white' },
    header: { backgroundColor: cTheme, padding: 40, color: 'white', flexDirection: 'row' },
    avatar: { width: 100, height: 100, borderRadius: 50, marginRight: 30 },
    headerText: { flex: 1 },
    name: { fontSize: 32, fontWeight: 900, marginBottom: 5, lineHeight: 1.1 },
    title: { fontSize: 14, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' },
    divider: { height: 2, width: 30, backgroundColor: 'white', marginVertical: 15 },
    body: { padding: 40, flexDirection: 'row' },
    leftCol: { width: '35%', paddingRight: 30 },
    rightCol: { width: '65%' },
    sectionTitle: { fontSize: 13, fontWeight: 900, textTransform: 'uppercase', borderBottom: `1px solid ${cTheme}`, paddingBottom: 5, marginBottom: 15, color: cTheme },
    contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    skillTag: { border: '1px solid #E5E7EB', padding: '4px 8px', borderRadius: 4, marginRight: 5, marginBottom: 5, fontSize: 9 }
  });

  return (
    <View key="t2-root">
      <View key="t2-header" style={styles.header}>
        {data.styleConfig?.showPhoto !== false && data.personalInfo.photo && <Image key="photo" src={data.personalInfo.photo} style={styles.avatar} />}
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
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'skills', 'Habilidades')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {data.skills.filter(s => s?.name && s.name.trim() !== '').map((s, idx) => <View key={s.id || `skill-${idx}`} style={styles.skillTag}><Text>{s.name.trim()}</Text></View>)}
              </View>
            </View>
          )}
        </View>
        <View key="right-col" style={styles.rightCol}>
          <Text style={styles.sectionTitle}>{getSectionTitle(data, 'experience', 'Experiência')}</Text>
          {data.experience.map((ex, idx) => (
            <View key={ex.id || `exp-${idx}`} style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: 700 }}>{ex.position}</Text>
              <Text style={{ fontSize: 10, color: cTheme, fontWeight: 900 }}>{ex.company}</Text>
              <Text style={{ fontSize: 8, color: '#9CA3AF', marginVertical: 4 }}>{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</Text>
              <Text style={{ fontSize: 10 }}>{ex.description.replace(/\*/g, '')}</Text>
            </View>
          ))}
          <RenderCustomSections customSections={data.customSections} headingStyle={styles.sectionTitle} />
        </View>
      </View>
    </View>
  );
};

const Template3 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#2D3748';
  const styles = StyleSheet.create({
    header: { padding: 40, borderBottom: '1px solid #E5E7EB', alignItems: 'center' },
    name: { fontSize: 36, fontWeight: 900, color: cTheme, lineHeight: 1.1 },
    title: { fontSize: 14, fontWeight: 700, color: cTheme, textTransform: 'uppercase', letterSpacing: 2, marginTop: 5 },
    contactRow: { flexDirection: 'row', gap: 20, marginTop: 15, justifyContent: 'center' },
    contactItem: { flexDirection: 'row', alignItems: 'center', gap: 5, fontSize: 9 },
    body: { padding: 40, flexDirection: 'row' },
    leftCol: { width: '35%', paddingRight: 30 },
    rightCol: { width: '65%' },
    sectionTitle: { fontSize: 11, fontWeight: 900, textTransform: 'uppercase', backgroundColor: '#F3F4F6', padding: '5px 10px', marginBottom: 15, color: cTheme }
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
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'education', 'Formação')}</Text>
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
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'skills', 'Habilidades')}</Text>
              {data.skills.filter(s => s?.name && s.name.trim() !== '').map((s, idx) => <Text key={s.id || `skill-${idx}`} style={{ fontSize: 10, marginBottom: 5 }}>• {s.name.trim()}</Text>)}
            </View>
          )}
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.sectionTitle}>Sobre Mim</Text>
          <Text style={{ fontSize: 10, marginBottom: 30, lineHeight: 1.6 }}>{data.personalInfo.summary.replace(/\*/g, '')}</Text>
          <Text style={styles.sectionTitle}>{getSectionTitle(data, 'experience', 'Experiência')}</Text>
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
          <RenderCustomSections customSections={data.customSections} headingStyle={styles.sectionTitle} />
        </View>
      </View>
    </View>
  );
};

const Template4 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#323232';
  const styles = StyleSheet.create({
    container: { flexDirection: 'row', height: '100%', backgroundColor: '#FFFFFF' },
    sidebar: { width: '35%', backgroundColor: cTheme, color: '#FFFFFF', padding: '40 30' },
    main: { width: '65%', padding: '40 40' },
    headerBox: { marginBottom: 30, alignItems: 'center' },
    name: { fontSize: 22, fontWeight: 900, textTransform: 'uppercase', marginBottom: 5, textAlign: 'center', lineHeight: 1.1 },
    jobTitle: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', color: '#E0E0E0' },
    photoWrapper: { width: 130, height: 130, borderRadius: 65, borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.15)', overflow: 'hidden', marginBottom: 30, alignSelf: 'center' },
    photo: { width: '100%', height: '100%', objectFit: 'cover' },
    sectionTitleSidebar: { fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', paddingBottom: 6, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.2)' },
    sidebarText: { fontSize: 9, marginBottom: 6, textAlign: 'center', color: '#D1D5DB' },
    sidebarSubHeading: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 2, textAlign: 'center', marginTop: 10 },
    
    sectionTitleMain: { fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#222222', paddingBottom: 4, marginBottom: 15, borderBottomWidth: 2, borderBottomColor: cTheme },
    summaryText: { fontSize: 10, lineHeight: 1.6, color: '#4B5563', marginBottom: 25 },
    
    expBox: { marginBottom: 20 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    expTitle: { fontSize: 11, fontWeight: 900, color: '#222222' },
    expDate: { fontSize: 9, color: '#6B7280', fontWeight: 700 },
    expCompany: { fontSize: 10, fontWeight: 700, fontStyle: 'italic', color: '#4B5563', marginBottom: 5 },
    expDesc: { fontSize: 9, lineHeight: 1.5, color: '#4B5563' },
    
    skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
    skillItem: { width: '45%' },
    skillName: { fontSize: 9, fontWeight: 700, color: '#222', marginBottom: 2 }
  });

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View style={styles.headerBox}>
          <Text style={styles.name}>{data.personalInfo.fullName}</Text>
          <Text style={styles.jobTitle}>{data.personalInfo.title}</Text>
        </View>

        {data.styleConfig?.showPhoto !== false && data.personalInfo.photo && (
          <View style={styles.photoWrapper}>
            <Image src={data.personalInfo.photo} style={styles.photo} />
          </View>
        )}

        <View style={{ marginBottom: 30 }}>
          <Text style={styles.sectionTitleSidebar}>Contacto</Text>
          <Text style={styles.sidebarText}>{data.personalInfo.email}</Text>
          <Text style={styles.sidebarText}>{data.personalInfo.phone}</Text>
          <Text style={styles.sidebarText}>{data.personalInfo.location}</Text>
          {data.personalInfo.website && <Text style={styles.sidebarText}>{data.personalInfo.website}</Text>}
        </View>

        {data.education && data.education.length > 0 && (
          <View style={{ marginBottom: 30 }}>
            <Text style={styles.sectionTitleSidebar}>{getSectionTitle(data, 'education', 'Educação')}</Text>
            {data.education.map((edu, idx) => (
              <View key={edu.id || `edu-${idx}`} style={{ marginBottom: 12 }}>
                <Text style={styles.sidebarSubHeading}>{edu.institution}</Text>
                <Text style={styles.sidebarText}>{edu.degree} - {edu.field}</Text>
                <Text style={[styles.sidebarText, { fontSize: 8 }]}>{edu.startDate} - {edu.endDate}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.main}>
        {data.personalInfo.summary && (
           <View>
             <Text style={styles.sectionTitleMain}>Perfil</Text>
             <Text style={styles.summaryText}>{data.personalInfo.summary.replace(/\*/g, '')}</Text>
           </View>
        )}

        {data.experience && data.experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitleMain}>{getSectionTitle(data, 'experience', 'Experiência')}</Text>
            {data.experience.map((ex, idx) => (
              <View key={ex.id || `exp-${idx}`} style={[styles.expBox, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>
                <View style={styles.expHeader}>
                  <Text style={styles.expTitle}>{ex.position}</Text>
                  <Text style={styles.expDate}>{ex.startDate} - {ex.endDate}</Text>
                </View>
                <Text style={styles.expCompany}>{ex.company}</Text>
                <Text style={styles.expDesc}>{ex.description.replace(/\*/g, '')}</Text>
              </View>
            ))}
          </View>
        )}

        {data.skills && data.skills.length > 0 && (
           <View style={{ marginTop: 5 }}>
             <Text style={styles.sectionTitleMain}>{getSectionTitle(data, 'skills', 'Habilidades')}</Text>
             <View style={styles.skillsGrid}>
               {data.skills.filter(s => s?.name && s.name.trim() !== '').map((s, idx) => (
                 <View key={s.id || `skill-${idx}`} style={styles.skillItem}>
                   <Text style={styles.skillName}>• {s.name.trim()}</Text>
                 </View>
               ))}
             </View>
           </View>
        )}

        {data.languages && data.languages.length > 0 && (
           <View style={{ marginTop: 5 }}>
             <Text style={styles.sectionTitleMain}>{getSectionTitle(data, 'languages', 'Idiomas')}</Text>
             <View style={styles.skillsGrid}>
               {data.languages.filter(s => s?.name && s.name.trim() !== '').map((s, idx) => (
                 <View key={s.id || `lang-${idx}`} style={styles.skillItem}>
                   <Text style={styles.skillName}>• {s.name.trim()} - {s.level}</Text>
                 </View>
               ))}
             </View>
           </View>
        )}
        <RenderCustomSections customSections={data.customSections} headingStyle={styles.sectionTitleMain} />
      </View>
    </View>
  );
};

const Template5 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#1B2E4B';
  const styles = StyleSheet.create({
    container: { height: '100%', backgroundColor: '#FFFFFF', padding: 30 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    headerLeft: { width: '55%', paddingTop: 20 },
    name: { fontSize: 38, fontWeight: 900, color: cTheme, lineHeight: 1.1, textTransform: 'uppercase' },
    title: { fontSize: 16, fontWeight: 700, color: '#4B5563', marginTop: 8 },
    
    headerRight: { width: '40%', alignItems: 'flex-end' },
    photoWrapper: { width: 150, height: 180, overflow: 'hidden', borderBottomLeftRadius: 75, borderBottomRightRadius: 75, borderTopLeftRadius: 75, borderTopRightRadius: 75, backgroundColor: '#E2E8F0' },
    photo: { width: '100%', height: '100%', objectFit: 'cover' },
    
    body: { flexDirection: 'row', height: '100%', flex: 1 },
    
    leftColumn: { width: '40%', backgroundColor: cTheme, borderTopRightRadius: 60, padding: 30, color: '#FFFFFF' },
    leftSectionTitle: { fontSize: 16, fontWeight: 900, color: '#FFFFFF', marginBottom: 15, marginTop: 25 },
    leftText: { fontSize: 9, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 8 },
    
    rightColumn: { width: '60%', padding: '30 0 0 30' },
    rightSectionTitle: { fontSize: 18, fontWeight: 900, color: cTheme, marginBottom: 15, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginTop: 10 },
    
    expBox: { marginBottom: 20 },
    expTitle: { fontSize: 11, fontWeight: 900, color: '#111827' },
    expCompanyRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
    expCompany: { fontSize: 10, fontWeight: 700, color: cTheme },
    expDate: { fontSize: 9, fontWeight: 700, color: '#6B7280' },
    expDesc: { fontSize: 9, color: '#4B5563', lineHeight: 1.5, marginTop: 4 },
    
    eduBox: { marginBottom: 15 },
    eduTitle: { fontSize: 11, fontWeight: 900, color: '#111827' },
    eduDegree: { fontSize: 10, color: '#4B5563', marginTop: 2 },
    eduDate: { fontSize: 9, color: '#6B7280', marginTop: 2, fontWeight: 700 },
    
    skillCircleText: { fontSize: 8, color: '#FFFFFF' }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{data.personalInfo.fullName.split(' ')[0]}</Text>
          <Text style={styles.name}>{data.personalInfo.fullName.split(' ').slice(1).join(' ')}</Text>
          <Text style={styles.title}>{data.personalInfo.title}</Text>
        </View>
        <View style={styles.headerRight}>
          {data.styleConfig?.showPhoto !== false && data.personalInfo.photo && (
            <View style={styles.photoWrapper}>
              <Image src={data.personalInfo.photo} style={styles.photo} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.leftColumn}>
          {data.personalInfo.summary && (
            <View>
              <Text style={[styles.leftSectionTitle, { marginTop: 0 }]}>Perfil</Text>
              <Text style={styles.leftText}>{data.personalInfo.summary.replace(/\*/g, '')}</Text>
            </View>
          )}
          
          <View>
             <Text style={styles.leftSectionTitle}>Contacto</Text>
             <Text style={styles.leftText}>{data.personalInfo.phone}</Text>
             <Text style={styles.leftText}>{data.personalInfo.email}</Text>
             <Text style={styles.leftText}>{data.personalInfo.location}</Text>
             {data.personalInfo.website && <Text style={styles.leftText}>{data.personalInfo.website}</Text>}
          </View>
          
          {data.skills && data.skills.length > 0 && (
            <View>
              <Text style={styles.leftSectionTitle}>{getSectionTitle(data, 'skills', 'Habilidades')}</Text>
              <View style={{ gap: 6 }}>
                {data.skills.filter(s => s?.name).map((s, idx) => (
                  <Text key={s.id || `skill-${idx}`} style={styles.leftText}>• {s.name.trim()}</Text>
                ))}
              </View>
            </View>
          )}
          
          {data.languages && data.languages.length > 0 && (
            <View>
              <Text style={styles.leftSectionTitle}>{getSectionTitle(data, 'languages', 'Idiomas')}</Text>
              <View style={{ gap: 6 }}>
                {data.languages.filter(s => s?.name).map((s, idx) => (
                  <Text key={s.id || `lang-${idx}`} style={styles.leftText}>• {s.name.trim()} - {s.level}</Text>
                ))}
              </View>
            </View>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <View>
              <Text style={styles.leftSectionTitle}>{getSectionTitle(data, 'certifications', 'Certificações')}</Text>
              <View style={{ gap: 6 }}>
                {data.certifications.filter(s => s?.name).map((s, idx) => (
                  <View key={s.id || `cert-${idx}`} style={{ marginBottom: 4 }}>
                    <Text style={[styles.leftText, { fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 }]}>• {s.name.trim()}</Text>
                    {s.date && <Text style={[styles.leftText, { fontSize: 8, opacity: 0.7, paddingLeft: 8 }]}>{s.date}</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}

          {data.interests && data.interests.length > 0 && (
            <View>
              <Text style={styles.leftSectionTitle}>{getSectionTitle(data, 'interests', 'Interesses')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {data.interests.map((interest, idx) => (
                  <Text key={idx} style={[styles.leftText, { backgroundColor: 'rgba(255,255,255,0.15)', padding: '2 6', borderRadius: 4, marginRight: 4, marginBottom: 4 }]}>{interest}</Text>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.rightColumn}>
          {data.experience && data.experience.length > 0 && (
            <View>
              <Text style={[styles.rightSectionTitle, { marginTop: 0 }]}>{getSectionTitle(data, 'experience', 'Experiência')}</Text>
              {data.experience.map((ex, idx) => (
                <View key={ex.id || `exp-${idx}`} style={[styles.expBox, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>
                  <Text style={styles.expTitle}>{ex.position}</Text>
                  <View style={styles.expCompanyRow}>
                    <Text style={styles.expCompany}>{ex.company}</Text>
                    <Text style={styles.expDate}>{ex.startDate} • {ex.endDate}</Text>
                  </View>
                  <Text style={styles.expDesc}>{ex.description.replace(/\*/g, '')}</Text>
                </View>
              ))}
            </View>
          )}
          
          {data.education && data.education.length > 0 && (
            <View>
              <Text style={styles.rightSectionTitle}>{getSectionTitle(data, 'education', 'Educação')}</Text>
              {data.education.map((e, idx) => (
                <View key={e.id || `edu-${idx}`} style={styles.eduBox}>
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                     <Text style={styles.eduTitle}>{e.institution}</Text>
                     <Text style={styles.expDate}>{e.startDate} • {e.endDate}</Text>
                   </View>
                   <Text style={styles.eduDegree}>{e.degree} - {e.field}</Text>
                </View>
              ))}
            </View>
          )}
          <RenderCustomSections customSections={data.customSections} headingStyle={styles.rightSectionTitle} />
        </View>
      </View>
    </View>
  );
};

const CoverLetter = ({ data }: { data: any }) => {
  const cTheme = data.themeColor || '#1B2A4A';
  const isEn = data.language === 'en';
  const styles = StyleSheet.create({
    container: { padding: 50, flex: 1 },
    header: { marginBottom: 30, borderBottom: `1.5pt solid ${cTheme}40`, paddingBottom: 20 },
    name: { fontSize: 24, fontWeight: 900, color: cTheme, marginBottom: 6, lineHeight: 1.1 },
    title: { fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    contactRow: { flexDirection: 'row', gap: 15, alignItems: 'center' },
    contactItem: { flexDirection: 'row', alignItems: 'center' },
    contactText: { fontSize: 9, color: '#4B5563', marginLeft: 4 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, marginTop: 30, fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' },
    content: { fontSize: 12, lineHeight: 1.8, color: '#374151', textAlign: 'justify' },
    footer: { marginTop: 60, alignItems: 'flex-end' },
    signature: { fontSize: 14, fontWeight: 900, color: cTheme, marginTop: 10, fontStyle: 'italic' }
  });

  const info = data.personalInfo || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{info.fullName || 'Seu Nome'}</Text>
        <Text style={styles.title}>{info.title || (isEn ? 'Your Position' : 'Seu Cargo')}</Text>
        <View style={styles.contactRow}>
          {info.email && (
            <View style={styles.contactItem}>
              <Icons.Mail />
              <Text style={styles.contactText}>{info.email}</Text>
            </View>
          )}
          {info.phone && (
            <View style={styles.contactItem}>
              <Icons.Phone />
              <Text style={styles.contactText}>{info.phone}</Text>
            </View>
          )}
          {info.location && (
            <View style={styles.contactItem}>
              <Icons.MapPin />
              <Text style={styles.contactText}>{info.location}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.dateRow}>
        <Text>Ref: {isEn ? 'Spontaneous Application' : 'Candidatura Espontânea'}</Text>
        <Text>{isEn ? '' : 'Luanda, '}{new Date().toLocaleDateString(isEn ? 'en-US' : 'pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
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

const Template6 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#34495E';
  const styles = StyleSheet.create({
    container: { padding: 40, flex: 1, backgroundColor: '#fcfcfc', border: `12pt solid ${cTheme}` },
    header: { alignItems: 'center', borderBottom: `2pt solid ${cTheme}`, paddingBottom: 20, marginBottom: 20 },
    photo: { width: 100, height: 100, borderRadius: 15, marginBottom: 15 },
    name: { fontSize: 36, fontWeight: 900, color: cTheme, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    title: { fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 4 },
    contactRow: { flexDirection: 'row', gap: 15, marginTop: 15, justifyContent: 'center' },
    contactText: { fontSize: 9, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 },
    body: { flexDirection: 'row', gap: 40 },
    col: { flex: 1 },
    sectionTitle: { fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 15, color: '#111827' },
    expBox: { marginBottom: 20, paddingLeft: 10, borderLeft: `2pt solid ${cTheme}` },
    expTitle: { fontSize: 11, fontWeight: 900, color: '#111827' },
    expCompany: { fontSize: 9, fontWeight: 700, color: '#6B7280', marginBottom: 2 },
    expDesc: { fontSize: 9, lineHeight: 1.6, color: '#4B5563' },
    summary: { fontSize: 11, fontStyle: 'italic', color: '#4B5563', textAlign: 'center', marginBottom: 30, lineHeight: 1.8 }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {data.styleConfig?.showPhoto !== false && data.personalInfo.photo && <Image src={data.personalInfo.photo} style={styles.photo} />}
        <Text style={styles.name}>{data.personalInfo.fullName}</Text>
        <Text style={styles.title}>{data.personalInfo.title}</Text>
        <View style={styles.contactRow}>
          <Text style={styles.contactText}>{data.personalInfo.phone}</Text>
          <Text style={styles.contactText}>•</Text>
          <Text style={styles.contactText}>{data.personalInfo.email}</Text>
        </View>
      </View>
      
      {data.personalInfo.summary && (
        <Text style={styles.summary}>"{data.personalInfo.summary.replace(/\*/g, '')}"</Text>
      )}

      <View style={styles.body}>
        <View style={styles.col}>
          {data.experience.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'experience', 'Experiência')}</Text>
              {data.experience.map((ex, idx) => (
                <View key={ex.id || `exp-${idx}`} style={[styles.expBox, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>
                  <Text style={styles.expTitle}>{ex.position}</Text>
                  <Text style={styles.expCompany}>{ex.company} | {ex.startDate} - {ex.endDate}</Text>
                  <Text style={styles.expDesc}>{ex.description.replace(/\*/g, '')}</Text>
                </View>
              ))}
            </View>
          )}
          <RenderCustomSections customSections={data.customSections} headingStyle={styles.sectionTitle} />
        </View>
        <View style={styles.col}>
          {data.education.length > 0 && (
            <View style={{ marginBottom: 30 }}>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'education', 'Formação')}</Text>
              {data.education.map((e, idx) => (
                <View key={e.id || `edu-${idx}`} style={{ marginBottom: 15, padding: 15, backgroundColor: '#FFFFFF', border: '1pt solid #E5E7EB', borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: 900, color: '#111827' }}>{e.degree}</Text>
                  <Text style={{ fontSize: 9, color: '#4B5563', marginVertical: 2 }}>{e.institution}</Text>
                  <Text style={{ fontSize: 8, fontWeight: 900, color: '#9CA3AF' }}>{e.startDate} - {e.endDate}</Text>
                </View>
              ))}
            </View>
          )}
          {data.skills.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'skills', 'Habilidades')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {data.skills.filter(s => s?.name).map((s, idx) => (
                  <Text key={s.id || `skill-${idx}`} style={{ padding: '4 8', backgroundColor: '#FFFFFF', border: '1pt solid #E5E7EB', borderRadius: 4, fontSize: 8, fontWeight: 700, color: '#374151' }}>{s.name.trim()}</Text>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const Template7 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#186A3B';
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { backgroundColor: cTheme, padding: 40, paddingBottom: 60, color: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between' },
    name: { fontSize: 36, fontWeight: 900, textTransform: 'uppercase', marginBottom: 5 },
    title: { fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.9 },
    contactBar: { backgroundColor: '#F3F4F6', padding: '15 40', flexDirection: 'row', gap: 20 },
    contactText: { fontSize: 9, fontWeight: 900, color: '#6B7280', textTransform: 'uppercase' },
    body: { padding: 40, flexDirection: 'row', gap: 30 },
    mainCol: { width: '60%', borderRight: '1pt solid #E5E7EB', paddingRight: 30 },
    sideCol: { width: '40%' },
    sectionTitle: { fontSize: 16, fontWeight: 900, textTransform: 'uppercase', color: '#111827', marginBottom: 15 },
    expBox: { marginBottom: 20 },
    expTitle: { fontSize: 12, fontWeight: 900, color: '#111827' },
    expDate: { fontSize: 9, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase' },
    expCompany: { fontSize: 10, fontWeight: 900, color: cTheme, textTransform: 'uppercase', marginVertical: 3 },
    expDesc: { fontSize: 10, lineHeight: 1.6, color: '#4B5563' }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: '70%' }}>
          <Text style={styles.name}>{data.personalInfo.fullName}</Text>
          <Text style={styles.title}>{data.personalInfo.title}</Text>
        </View>
        {data.styleConfig?.showPhoto !== false && data.personalInfo.photo && (
          <Image src={data.personalInfo.photo} style={{ width: 80, height: 80, borderRadius: 40, border: '3pt solid white' }} />
        )}
      </View>
      <View style={styles.contactBar}>
        <Text style={styles.contactText}>{data.personalInfo.phone}</Text>
        <Text style={styles.contactText}>{data.personalInfo.email}</Text>
        <Text style={styles.contactText}>{data.personalInfo.location}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.mainCol}>
          {data.personalInfo.summary && (
            <View style={{ marginBottom: 30 }}>
              <Text style={styles.sectionTitle}>Síntese</Text>
              <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#4B5563' }}>{data.personalInfo.summary.replace(/\*/g, '')}</Text>
            </View>
          )}
          {data.experience.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'experience', 'Experiência')}</Text>
              {data.experience.map((ex, idx) => (
                <View key={ex.id || `exp-${idx}`} style={[styles.expBox, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.expTitle}>{ex.position}</Text>
                    <Text style={styles.expDate}>{ex.startDate} - {ex.endDate}</Text>
                  </View>
                  <Text style={styles.expCompany}>{ex.company}</Text>
                  <Text style={styles.expDesc}>{ex.description.replace(/\*/g, '')}</Text>
                </View>
              ))}
            </View>
          )}
          <RenderCustomSections customSections={data.customSections} headingStyle={styles.sectionTitle} />
        </View>
        <View style={styles.sideCol}>
          {data.skills.length > 0 && (
            <View style={{ marginBottom: 30 }}>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'skills', 'Habilidades')}</Text>
              {data.skills.filter(s => s?.name).map((s, idx) => {
                const showLevel = s.level && s.level !== 'Ocultar';
                const value = s.level === 'Especialista' ? '100%' : s.level === 'Avançado' ? '80%' : s.level === 'Intermédio' ? '60%' : s.level === 'Básico' ? '40%' : s.level === 'Iniciante' ? '20%' : '0%';
                return (
                  <View key={s.id || `skill-${idx}`} style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 9, fontWeight: 700, color: '#4B5563', marginBottom: 2 }}>{s.name.trim()}</Text>
                    {showLevel && (
                      <View style={{ width: '100%', height: 4, backgroundColor: '#F3F4F6', borderRadius: 2 }}>
                         <View style={{ height: 4, borderRadius: 2, backgroundColor: cTheme, width: value }} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          {data.education.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'education', 'Educação')}</Text>
              {data.education.map((e, idx) => (
                <View key={e.id || `edu-${idx}`} style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 10, fontWeight: 900, color: '#111827' }}>{e.degree}</Text>
                  <Text style={{ fontSize: 9, color: '#4B5563', marginTop: 2 }}>{e.institution}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const Template8 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#1E40AF';
  const styles = StyleSheet.create({
    container: { flexDirection: 'row', height: '100%', backgroundColor: '#FFFFFF', position: 'relative' },
    leftCol: { width: '35%', backgroundColor: '#F9FAFB', borderRight: '1pt solid #E5E7EB', padding: 20, paddingTop: 115 },
    rightCol: { width: '65%', padding: 25, paddingTop: 30 },
    avatar: { width: 90, height: 90, borderRadius: 45, border: '3pt solid #38BDF8', alignSelf: 'center', marginBottom: 20, objectFit: 'cover' },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 24, fontWeight: 900, color: '#9CA3AF' },
    sidebarTitle: { fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: cTheme, borderBottom: '1.5pt solid #38BDF8', paddingBottom: 4, marginBottom: 12, textAlign: 'center' },
    contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    contactBubble: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
    contactText: { fontSize: 8, color: '#4B5563', flex: 1 },
    skillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    skillText: { fontSize: 8, color: '#4B5563', fontWeight: 700, width: '55%' },
    skillDots: { flexDirection: 'row', gap: 3 },
    skillDot: { width: 5, height: 5, borderRadius: 2.5 },
    interestBadge: { padding: '3 6', backgroundColor: '#FFFFFF', border: '1pt solid #E5E7EB', borderRadius: 10, fontSize: 8, color: '#4B5563', marginRight: 4, marginBottom: 4 },
    interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 5 },
    
    headerBlock: { marginBottom: 35, marginTop: 10 },
    name: { fontSize: 24, fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', marginBottom: 2 },
    title: { fontSize: 10, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: 2 },
    
    sectionTitle: { fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#FFFFFF', backgroundColor: cTheme, padding: '4 12', borderRadius: 10, marginBottom: 10, marginTop: 12, alignSelf: 'flex-start' },
    summary: { fontSize: 9, lineHeight: 1.6, color: '#4B5563', marginBottom: 10 },
    
    timelineItem: { position: 'relative', paddingLeft: 12, borderLeft: '1.5pt solid #38BDF8', marginBottom: 12, marginLeft: 4 },
    timelineDot: { position: 'absolute', left: -4.5, top: 2, width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#38BDF8', border: '1.5pt solid #FFFFFF' },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
    itemTitle: { fontSize: 9, fontWeight: 900, color: '#111827' },
    itemSubtitle: { fontSize: 8, fontWeight: 700, color: cTheme },
    itemPeriod: { fontSize: 8, fontWeight: 900, color: '#38BDF8' },
    itemDesc: { fontSize: 8.5, lineHeight: 1.5, color: '#4B5563', marginTop: 2 }
  });

  return (
    <View style={styles.container}>
      {/* Top Geometric Accent */}
      <Svg style={{ position: 'absolute', top: 0, left: 0, width: 595, height: 130 }}>
        <Path d="M0 0 L595 0 L595 18 L0 102 Z" fill="#38BDF8" opacity={0.3} />
        <Path d="M0 0 L595 0 L595 48 L0 120 Z" fill={cTheme} />
      </Svg>

      {/* Bottom Geometric Accent */}
      <Svg style={{ position: 'absolute', bottom: 0, left: 0, width: 595, height: 35 }}>
        <Path d="M0 35 L595 35 L595 9 L0 35 Z" fill="#38BDF8" opacity={0.2} />
        <Path d="M0 35 L595 35 L595 0 L0 35 Z" fill={cTheme} />
      </Svg>

      <View style={styles.leftCol}>
        {data.styleConfig?.showPhoto !== false && (
          data.personalInfo.photo ? (
            <Image src={data.personalInfo.photo} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV'}</Text>
            </View>
          )
        )}

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sidebarTitle}>Contacto</Text>
          <View style={{ gap: 4 }}>
            {data.personalInfo.email && (
              <View style={styles.contactItem}>
                <View style={styles.contactBubble}><Icons.Mail /></View>
                <Text style={styles.contactText}>{data.personalInfo.email}</Text>
              </View>
            )}
            {data.personalInfo.phone && (
              <View style={styles.contactItem}>
                <View style={styles.contactBubble}><Icons.Phone /></View>
                <Text style={styles.contactText}>{data.personalInfo.phone}</Text>
              </View>
            )}
            {data.personalInfo.location && (
              <View style={styles.contactItem}>
                <View style={styles.contactBubble}><Icons.MapPin /></View>
                <Text style={styles.contactText}>{data.personalInfo.location}</Text>
              </View>
            )}
          </View>
        </View>

        {data.skills.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sidebarTitle}>{getSectionTitle(data, 'skills', 'Habilidades')}</Text>
            {data.skills.filter(s => s && s.name).map((s, idx) => {
              const showDots = s.level && s.level !== 'Ocultar';
              const count = s.level === 'Especialista' ? 5 : s.level === 'Avançado' ? 4 : s.level === 'Intermédio' ? 3 : s.level === 'Básico' ? 2 : s.level === 'Iniciante' ? 1 : 0;
              return (
                <View key={s.id || `skill-${idx}`} style={styles.skillRow}>
                  <Text style={styles.skillText}>{s.name}</Text>
                  {showDots && (
                    <View style={styles.skillDots}>
                      {[1, 2, 3, 4, 5].map(d => (
                        <View key={d} style={[styles.skillDot, { backgroundColor: d <= count ? '#38BDF8' : '#E5E7EB' }]} />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {data.interests && data.interests.length > 0 && (
          <View>
            <Text style={styles.sidebarTitle}>{getSectionTitle(data, 'interests', 'Interesses')}</Text>
            <View style={styles.interestsWrap}>
              {data.interests.map((interest, idx) => (
                <Text key={idx} style={styles.interestBadge}>{interest}</Text>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.rightCol}>
        <View style={styles.headerBlock}>
          <Text style={styles.name}>{data.personalInfo.fullName || 'Seu Nome'}</Text>
          <Text style={styles.title}>{data.personalInfo.title || 'Cargo Desejado'}</Text>
        </View>

        {data.personalInfo.summary && (
          <View>
            <Text style={styles.sectionTitle}>Sobre Mim</Text>
            <Text style={styles.summary}>{data.personalInfo.summary.replace(/\*/g, '')}</Text>
          </View>
        )}

        {data.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Formação Académica</Text>
            {data.education.map((e, idx) => (
              <View key={e.id || `edu-${idx}`} style={[styles.timelineItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }]}>
                {data.styleConfig?.showTimeline !== false && <View style={styles.timelineDot} />}
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{e.degree}</Text>
                  <Text style={styles.itemPeriod}>{e.startDate} - {e.endDate}</Text>
                </View>
                <Text style={styles.itemSubtitle}>{e.institution}</Text>
              </View>
            ))}
          </View>
        )}

        {data.experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{getSectionTitle(data, 'experience', 'Experiência Profissional')}</Text>
            {data.experience.map((ex, idx) => (
              <View key={ex.id || `exp-${idx}`} style={[styles.timelineItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }]}>
                {data.styleConfig?.showTimeline !== false && <View style={styles.timelineDot} />}
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{ex.position}</Text>
                  <Text style={styles.itemPeriod}>{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</Text>
                </View>
                <Text style={styles.itemSubtitle}>{ex.company}</Text>
                <Text style={styles.itemDesc}>{ex.description.replace(/\*/g, '')}</Text>
              </View>
            ))}
          </View>
        )}
        <RenderCustomSections customSections={data.customSections} headingStyle={styles.sectionTitle} />
      </View>
    </View>
  );
};

const Template9 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#0F766E';
  const styles = StyleSheet.create({
    container: { flexDirection: 'column', height: '100%', backgroundColor: '#FFFFFF' },
    header: { backgroundColor: cTheme, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerText: { width: '65%' },
    name: { fontSize: 24, fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', marginBottom: 2 },
    title: { fontSize: 10, fontWeight: 700, color: '#D1FAE5', textTransform: 'uppercase', letterSpacing: 2 },
    avatar: { width: 80, height: 80, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 0, border: '3pt solid #FFFFFF', objectFit: 'cover' },
    avatarPlaceholder: { width: 80, height: 80, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 0, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center', border: '3pt solid #FFFFFF' },
    avatarText: { fontSize: 24, fontWeight: 900, color: '#FFFFFF' },
    
    body: { flex: 1, flexDirection: 'row' },
    leftCol: { width: '35%', backgroundColor: '#073E3A', padding: 20, color: '#FFFFFF' },
    rightCol: { width: '65%', padding: 25 },
    
    sidebarSection: { marginBottom: 18 },
    sidebarTitle: { fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.1)', padding: '3 8', borderRadius: 10, marginBottom: 8, textAlign: 'center' },
    contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    contactText: { fontSize: 8, color: '#E2E8F0', marginLeft: 4, flex: 1 },
    sidebarItem: { marginBottom: 8 },
    sidebarItemTitle: { fontSize: 8.5, fontWeight: 900, color: '#FFFFFF' },
    sidebarItemSubtitle: { fontSize: 7.5, color: '#A7F3D0', fontWeight: 700 },
    sidebarItemDate: { fontSize: 7, color: '#6EE7B7' },
    
    sectionTitle: { fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#FFFFFF', backgroundColor: cTheme, padding: '4 12', borderRadius: 10, marginBottom: 12, marginTop: 10, alignSelf: 'flex-start' },
    summaryText: { fontSize: 9, lineHeight: 1.6, color: '#4B5563', fontStyle: 'italic', marginBottom: 12 },
    expBox: { marginBottom: 14 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
    expTitle: { fontSize: 9, fontWeight: 900, color: '#111827' },
    expDate: { fontSize: 8, fontWeight: 900, color: '#9CA3AF' },
    expCompany: { fontSize: 8.5, fontWeight: 900, color: cTheme, textTransform: 'uppercase', marginBottom: 3 },
    expDesc: { fontSize: 8.5, lineHeight: 1.5, color: '#4B5563' },
    
    skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    skillItem: { width: '47%', marginBottom: 6 },
    skillName: { fontSize: 8, fontWeight: 700, color: '#374151', marginBottom: 2 },
    skillBar: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 2.5, flexDirection: 'row', gap: 1, padding: 0.5 },
    skillSegment: { flex: 1, height: '100%', borderRadius: 2 }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.name}>{data.personalInfo.fullName || 'Seu Nome'}</Text>
          <Text style={styles.title}>{data.personalInfo.title || 'Cargo Desejado'}</Text>
        </View>
        {data.styleConfig?.showPhoto !== false && (
          data.personalInfo.photo ? (
            <Image src={data.personalInfo.photo} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV'}</Text>
            </View>
          )
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.leftCol}>
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>Contacto</Text>
            {data.personalInfo.email && (
              <View style={styles.contactItem}>
                <Icons.Mail />
                <Text style={styles.contactText}>{data.personalInfo.email}</Text>
              </View>
            )}
            {data.personalInfo.phone && (
              <View style={styles.contactItem}>
                <Icons.Phone />
                <Text style={styles.contactText}>{data.personalInfo.phone}</Text>
              </View>
            )}
            {data.personalInfo.location && (
              <View style={styles.contactItem}>
                <Icons.MapPin />
                <Text style={styles.contactText}>{data.personalInfo.location}</Text>
              </View>
            )}
          </View>

          {data.education.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>{getSectionTitle(data, 'education', 'Formação')}</Text>
              {data.education.map((e, idx) => (
                <View key={e.id || `edu-${idx}`} style={styles.sidebarItem}>
                  <Text style={styles.sidebarItemTitle}>{e.degree}</Text>
                  <Text style={styles.sidebarItemSubtitle}>{e.institution}</Text>
                  <Text style={styles.sidebarItemDate}>{e.startDate} - {e.endDate}</Text>
                </View>
              ))}
            </View>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Prêmios</Text>
              {data.certifications.map((cVal, idx) => (
                <View key={cVal.id || `cert-${idx}`} style={styles.sidebarItem}>
                  <Text style={styles.sidebarItemTitle}>{cVal.name}</Text>
                  <Text style={styles.sidebarItemDate}>{cVal.date}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.rightCol}>
          {data.personalInfo.summary && (
            <View>
              <Text style={styles.sectionTitle}>Sobre Mim</Text>
              <Text style={styles.summaryText}>"{data.personalInfo.summary.replace(/\*/g, '')}"</Text>
            </View>
          )}

          {data.experience.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'experience', 'Experiência Profissional')}</Text>
              {data.experience.map((ex, idx) => (
                <View key={ex.id || `exp-${idx}`} style={[styles.expBox, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>
                  <View style={styles.expHeader}>
                    <Text style={styles.expTitle}>{ex.position}</Text>
                    <Text style={styles.expDate}>{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</Text>
                  </View>
                  <Text style={styles.expCompany}>{ex.company}</Text>
                  <Text style={styles.expDesc}>{ex.description.replace(/\*/g, '')}</Text>
                </View>
              ))}
            </View>
          )}

          {data.skills.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'skills', 'Habilidades')}</Text>
              <View style={styles.skillsGrid}>
                {data.skills.filter(s => s && s.name).map((s, idx) => {
                  const val = s.level === 'Especialista' ? 5 : s.level === 'Avançado' ? 4 : s.level === 'Intermédio' ? 3 : s.level === 'Básico' ? 2 : s.level === 'Iniciante' ? 1 : 0;
                  const showLevel = s.level && s.level !== 'Ocultar';
                  return (
                    <View key={s.id || `skill-${idx}`} style={styles.skillItem}>
                      <Text style={styles.skillName}>{s.name}</Text>
                      {showLevel && (
                        <View style={styles.skillBar}>
                          {[1, 2, 3, 4, 5].map(seg => (
                            <View 
                              key={seg} 
                              style={[styles.skillSegment, { backgroundColor: seg <= val ? cTheme : '#E5E7EB' }]} 
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          <RenderCustomSections customSections={data.customSections} headingStyle={styles.sectionTitle} />
        </View>
      </View>
    </View>
  );
};

const Template10 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#1A365D';
  const styles = StyleSheet.create({
    container: { flexDirection: 'column', height: '100%', backgroundColor: '#FFFFFF' },
    accentLine: { height: 10, backgroundColor: cTheme },
    
    header: { padding: '25 30', backgroundColor: '#F8FAFC', borderBottom: '1pt solid #E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { width: '65%' },
    name: { fontSize: 24, fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', marginBottom: 3 },
    title: { fontSize: 9, fontWeight: 900, color: cTheme, textTransform: 'uppercase', letterSpacing: 2 },
    summary: { fontSize: 8.5, color: '#64748B', fontStyle: 'italic', marginTop: 8, lineHeight: 1.5 },
    
    avatarContainer: { width: 75, height: 75, borderRadius: 37.5, border: `3pt solid ${cTheme}`, padding: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    avatar: { width: '100%', height: '100%', borderRadius: 37.5, objectFit: 'cover' },
    avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 37.5, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 22, fontWeight: 900, color: '#94A3B8' },

    body: { flex: 1, flexDirection: 'row' },
    leftCol: { width: '35%', backgroundColor: '#1E293B', padding: 20, color: '#FFFFFF' },
    rightCol: { width: '65%', padding: '25 20' },

    sidebarSection: { marginBottom: 20 },
    sidebarTitle: { fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '4 8', borderRadius: 4, marginBottom: 10 },
    
    contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    contactText: { fontSize: 8, color: '#F1F5F9', marginLeft: 6, flex: 1 },
    
    skillItem: { marginBottom: 10 },
    skillHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    skillName: { fontSize: 8, color: '#F1F5F9', fontWeight: 700 },
    skillLevel: { fontSize: 7, color: '#94A3B8' },
    skillBar: { height: 4, backgroundColor: '#475569', borderRadius: 2, flexDirection: 'row', gap: 1 },
    skillSegment: { flex: 1, height: '100%', borderRadius: 1 },

    langItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    langName: { fontSize: 8, color: '#F1F5F9', fontWeight: 700 },
    langLevel: { fontSize: 7, color: '#CBD5E1' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', borderBottom: '1.5pt solid #E2E8F0', paddingBottom: 4, marginBottom: 12, marginTop: 15 },
    sectionTitle: { fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: '#1E293B' },
    
    expItem: { marginBottom: 12, borderLeft: `1.5pt solid ${cTheme}`, paddingLeft: 10, marginLeft: 2 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
    expTitle: { fontSize: 9.5, fontWeight: 900, color: '#0F172A' },
    expDate: { fontSize: 7.5, color: '#64748B', fontWeight: 700 },
    expCompany: { fontSize: 8.5, fontWeight: 900, color: cTheme, textTransform: 'uppercase', marginBottom: 4 },
    expDesc: { fontSize: 8, lineHeight: 1.5, color: '#334155' },

    eduItem: { marginBottom: 10, borderLeft: `1.5pt solid ${cTheme}`, paddingLeft: 10, marginLeft: 2 },
    eduHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
    eduDegree: { fontSize: 9, fontWeight: 900, color: '#0F172A' },
    eduDate: { fontSize: 7.5, color: '#64748B', fontWeight: 700 },
    eduInstitution: { fontSize: 8, color: '#475569', fontWeight: 700 },

    certGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    certItem: { width: '47%', borderLeft: '1pt solid #E2E8F0', paddingLeft: 6, marginBottom: 6 },
    certName: { fontSize: 8.5, fontWeight: 900, color: '#1E293B' },
    certDate: { fontSize: 7, color: '#94A3B8', textTransform: 'uppercase' },

    footerLine: { height: 10, backgroundColor: '#0F172A' }
  });

  return (
    <View style={styles.container}>
      <View style={styles.accentLine} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{data.personalInfo.fullName || 'Seu Nome'}</Text>
          <Text style={styles.title}>{data.personalInfo.title || 'Cargo Desejado'}</Text>
          {data.personalInfo.summary && (
            <Text style={styles.summary}>"{data.personalInfo.summary.replace(/\*/g, '')}"</Text>
          )}
        </View>
        {data.styleConfig?.showPhoto !== false && (
          <View style={styles.avatarContainer}>
            {data.personalInfo.photo ? (
              <Image src={data.personalInfo.photo} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.leftCol}>
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>Contacto</Text>
            {data.personalInfo.phone && (
              <View style={styles.contactItem}>
                <Icons.Phone />
                <Text style={styles.contactText}>{data.personalInfo.phone}</Text>
              </View>
            )}
            {data.personalInfo.email && (
              <View style={styles.contactItem}>
                <Icons.Mail />
                <Text style={styles.contactText}>{data.personalInfo.email}</Text>
              </View>
            )}
            {data.personalInfo.location && (
              <View style={styles.contactItem}>
                <Icons.MapPin />
                <Text style={styles.contactText}>{data.personalInfo.location}</Text>
              </View>
            )}
          </View>

          {data.skills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>{getSectionTitle(data, 'skills', 'Habilidades')}</Text>
              {data.skills.filter(s => s && s.name).map((s, idx) => {
                const value = s.level === 'Especialista' ? 5 : s.level === 'Avançado' ? 4 : s.level === 'Intermédio' ? 3 : s.level === 'Básico' ? 2 : s.level === 'Iniciante' ? 1 : 0;
                const showLevel = s.level && s.level !== 'Ocultar';
                return (
                  <View key={s.id || `skill-${idx}`} style={styles.skillItem}>
                    <View style={styles.skillHeader}>
                      <Text style={styles.skillName}>{s.name}</Text>
                      {showLevel && <Text style={styles.skillLevel}>{s.level}</Text>}
                    </View>
                    {showLevel && (
                      <View style={styles.skillBar}>
                        {[1, 2, 3, 4, 5].map((seg) => (
                          <View 
                            key={seg} 
                            style={[
                              styles.skillSegment, 
                              { backgroundColor: seg <= value ? cTheme : '#475569' }
                            ]} 
                          />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {data.languages && data.languages.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>{getSectionTitle(data, 'languages', 'Idiomas')}</Text>
              {data.languages.map((l, idx) => (
                <View key={l.id || `lang-${idx}`} style={styles.langItem}>
                  <Text style={styles.langName}>{l.name}</Text>
                  <Text style={styles.langLevel}>{l.level}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.rightCol}>
          {data.experience.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{getSectionTitle(data, 'experience', 'Experiência Profissional')}</Text>
              </View>
              {data.experience.map((ex, idx) => (
                <View key={ex.id || `exp-${idx}`} style={[styles.expItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }]}>
                  <View style={styles.expHeader}>
                    <Text style={styles.expTitle}>{ex.position}</Text>
                    <Text style={styles.expDate}>{ex.startDate} - {ex.current ? "Presente" : ex.endDate}</Text>
                  </View>
                  <Text style={styles.expCompany}>{ex.company}</Text>
                  <Text style={styles.expDesc}>{ex.description.replace(/\*/g, '')}</Text>
                </View>
              ))}
            </View>
          )}

          {data.education.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Formação Académica</Text>
              </View>
              {data.education.map((e, idx) => (
                <View key={e.id || `edu-${idx}`} style={[styles.eduItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }]}>
                  <View style={styles.eduHeader}>
                    <Text style={styles.eduDegree}>{e.degree}</Text>
                    <Text style={styles.eduDate}>{e.startDate} - {e.endDate}</Text>
                  </View>
                  <Text style={styles.eduInstitution}>{e.institution}</Text>
                </View>
              ))}
            </View>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Certidões & Prêmios</Text>
              </View>
              <View style={styles.certGrid}>
                {data.certifications.map((cVal, idx) => (
                  <View key={cVal.id || `cert-${idx}`} style={styles.certItem}>
                    <Text style={styles.certName}>{cVal.name}</Text>
                    <Text style={styles.certDate}>{cVal.date}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <RenderCustomSections customSections={data.customSections} headingStyle={styles.sectionTitle} />
        </View>
      </View>
      <View style={styles.footerLine} />
    </View>
  );
};

const Template11 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#EA580C';
  const styles = StyleSheet.create({
    container: { flexDirection: 'row', height: '100%', backgroundColor: '#FFFFFF' },
    
    // Left column contains main content (63% width)
    leftCol: { width: '63%', padding: '25 20', borderRight: '1pt solid #F1F5F9' },
    
    profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatar: { width: 65, height: 65, borderRadius: 32.5, border: `2.5pt solid ${cTheme}`, marginRight: 12, objectFit: 'cover' },
    avatarPlaceholder: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#F1F5F9', border: `2.5pt solid ${cTheme}`, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 20, fontWeight: 900, color: cTheme },
    nameContainer: { flex: 1 },
    name: { fontSize: 21, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', marginBottom: 2 },
    title: { fontSize: 8.5, fontWeight: 900, color: cTheme, textTransform: 'uppercase', letterSpacing: 1.5 },

    sectionTitleBanner: { backgroundColor: cTheme, color: '#FFFFFF', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, padding: '4 8', borderRadius: 2, marginBottom: 12, marginTop: 15, alignSelf: 'flex-start' },
    summaryText: { fontSize: 8.5, lineHeight: 1.5, color: '#475569', fontStyle: 'italic', marginBottom: 10 },

    // Grid layout with year bar on left
    rowItem: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    yearBox: { width: 75, fontSize: 7, fontWeight: 900, color: cTheme, backgroundColor: `${cTheme}15`, border: `1pt solid ${cTheme}30`, padding: '4 2', textTransform: 'uppercase', alignSelf: 'flex-start', textAlign: 'center', borderRadius: 3 },
    rowContent: { flex: 1 },
    rowHeading: { fontSize: 9, fontWeight: 900, color: '#0F172A' },
    rowSubheading: { fontSize: 8, color: '#64748B', fontWeight: 700, marginVertical: 2 },
    rowDesc: { fontSize: 8, lineHeight: 1.4, color: '#334155' },

    // Right column as dark sidebar (37% width)
    rightCol: { width: '37%', backgroundColor: '#18181B', padding: 20, color: '#FFFFFF', justifyContent: 'space-between' },
    sidebarSection: { marginBottom: 18 },
    sidebarSectionHeader: { fontSize: 8.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, color: '#D4D4D8', borderBottom: '1pt solid #27272A', paddingBottom: 4, marginBottom: 10 },
    
    contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    contactText: { fontSize: 7.5, color: '#E4E4E7', marginLeft: 6, flex: 1 },

    skillItem: { marginBottom: 8 },
    skillName: { fontSize: 8, color: '#E4E4E7', fontWeight: 700, marginBottom: 3 },
    skillBar: { height: 4, backgroundColor: '#27272A', borderRadius: 2, overflow: 'hidden' },
    skillValue: { height: '100%', backgroundColor: cTheme, borderRadius: 2 },

    langItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    langName: { fontSize: 8, color: '#E4E4E7', fontWeight: 700 },
    langLevel: { fontSize: 7.5, color: '#A1A1AA' },

    certItem: { marginBottom: 8 },
    certTitle: { fontSize: 8, fontWeight: 900, color: '#F4F4F5' },
    certDate: { fontSize: 7, color: '#71717A' },

    decorativeBox: { height: 3, width: 35, backgroundColor: cTheme, borderRadius: 1.5 }
  });

  return (
    <View style={styles.container}>
      {/* Left Main Content Block */}
      <View style={styles.leftCol}>
        <View style={styles.profileHeader}>
          {data.styleConfig?.showPhoto !== false && (
            data.personalInfo.photo ? (
              <Image src={data.personalInfo.photo} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV'}
                </Text>
              </View>
            )
          )}
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{data.personalInfo.fullName || 'Seu Nome'}</Text>
            <Text style={styles.title}>{data.personalInfo.title || 'Cargo Desejado'}</Text>
          </View>
        </View>

        {data.personalInfo.summary && (
          <View>
            <Text style={styles.sectionTitleBanner}>Sobre Mim</Text>
            <Text style={styles.summaryText}>"{data.personalInfo.summary.replace(/\*/g, '')}"</Text>
          </View>
        )}

        {data.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitleBanner}>Formação acadêmica</Text>
            {data.education.map((e, idx) => (
              <View key={e.id || `edu-${idx}`} style={[styles.rowItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>
                <Text style={styles.yearBox}>{e.startDate} - {e.endDate}</Text>
                <View style={styles.rowContent}>
                  <Text style={styles.rowHeading}>{e.degree}</Text>
                  <Text style={styles.rowSubheading}>{e.institution}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {data.experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitleBanner}>{getSectionTitle(data, 'experience', 'Experiência Profissional')}</Text>
            {data.experience.map((ex, idx) => (
              <View key={ex.id || `exp-${idx}`} style={[styles.rowItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>
                <Text style={styles.yearBox}>{ex.startDate} - {ex.current ? "PRES." : ex.endDate}</Text>
                <View style={styles.rowContent}>
                  <Text style={styles.rowHeading}>{ex.position}</Text>
                  <Text style={[styles.rowSubheading, { color: cTheme }]}>{ex.company}</Text>
                  <Text style={styles.rowDesc}>{ex.description.replace(/\*/g, '')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <RenderCustomSections customSections={data.customSections} headingStyle={styles.sectionTitleBanner} />
      </View>

      {/* Right Column (Dark Sidebar) */}
      <View style={styles.rightCol}>
        <View>
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionHeader}>Contacto</Text>
            {data.personalInfo.phone && (
              <View style={styles.contactItem}>
                <Icons.Phone />
                <Text style={styles.contactText}>{data.personalInfo.phone}</Text>
              </View>
            )}
            {data.personalInfo.email && (
              <View style={styles.contactItem}>
                <Icons.Mail />
                <Text style={styles.contactText}>{data.personalInfo.email}</Text>
              </View>
            )}
            {data.personalInfo.location && (
              <View style={styles.contactItem}>
                <Icons.MapPin />
                <Text style={styles.contactText}>{data.personalInfo.location}</Text>
              </View>
            )}
          </View>

          {data.skills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionHeader}>{getSectionTitle(data, 'skills', 'Competências')}</Text>
              {data.skills.filter(s => s && s.name).map((s, idx) => {
                const value = s.level === 'Especialista' ? 100 : s.level === 'Avançado' ? 80 : s.level === 'Intermédio' ? 60 : s.level === 'Básico' ? 40 : s.level === 'Iniciante' ? 20 : 0;
                const showLevel = s.level && s.level !== 'Ocultar';
                return (
                  <View key={s.id || `skill-${idx}`} style={styles.skillItem}>
                    <Text style={styles.skillName}>{s.name}</Text>
                    {showLevel && (
                      <View style={styles.skillBar}>
                        <View style={[styles.skillValue, { width: `${value}%` }]} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {data.languages && data.languages.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionHeader}>{getSectionTitle(data, 'languages', 'Idiomas')}</Text>
              {data.languages.map((l, idx) => (
                <View key={l.id || `lang-${idx}`} style={styles.langItem}>
                  <Text style={styles.langName}>{l.name}</Text>
                  <Text style={styles.langLevel}>{l.level}</Text>
                </View>
              ))}
            </View>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionHeader}>Prêmios</Text>
              {data.certifications.map((cVal, idx) => (
                <View key={cVal.id || `cert-${idx}`} style={styles.certItem}>
                  <Text style={styles.certTitle}>{cVal.name}</Text>
                  <Text style={styles.certDate}>{cVal.date}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.decorativeBox} />
      </View>
    </View>
  );
};

const Template12 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#801D38';
  const styles = StyleSheet.create({
    container: { flexDirection: 'column', height: '100%', backgroundColor: '#FFFDFB', padding: 30 },
    topHairline: { height: 3, backgroundColor: cTheme, marginBottom: 15 },
    header: { alignItems: 'center', borderBottom: '1pt solid #F1F5F9', paddingBottom: 15, marginBottom: 15 },
    avatar: { width: 70, height: 70, borderRadius: 35, border: `1.5pt solid ${cTheme}`, marginBottom: 10, objectFit: 'cover' },
    avatarPlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FAF5F5', border: `1.5pt solid ${cTheme}`, marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 20, fontWeight: 900, color: cTheme },
    name: { fontSize: 28, fontWeight: 900, color: '#0F172A', textAlign: 'center', marginBottom: 4 },
    title: { fontSize: 9, fontWeight: 700, color: cTheme, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' },
    contactRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 15, marginTop: 8 },
    contactItem: { flexDirection: 'row', alignItems: 'center' },
    contactText: { fontSize: 8, color: '#64748B', marginLeft: 4 },
    summaryContainer: { borderBottom: '1pt solid #F1F5F9', paddingBottom: 15, marginBottom: 15 },
    summaryText: { fontSize: 9, lineHeight: 1.5, color: '#334155', fontStyle: 'italic', textAlign: 'center' },
    columns: { flexDirection: 'row', flex: 1, gap: 20 },
    leftCol: { width: '32%' },
    rightCol: { width: '68%' },
    sectionTitle: { fontSize: 9.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, borderBottom: `1pt solid ${cTheme}`, paddingBottom: 4, marginBottom: 10, color: '#0F172A' },
    skillRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    skillName: { fontSize: 8, color: '#475569', fontWeight: 700 },
    skillLevel: { fontSize: 7, color: '#94A3B8', textTransform: 'capitalize' },
    langRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    langName: { fontSize: 8, color: '#475569', fontWeight: 700 },
    langLevel: { fontSize: 7, color: '#94A3B8' },
    expItem: { marginBottom: 12 },
    expHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    expRole: { fontSize: 9.5, fontWeight: 900, color: '#0F172A' },
    expPeriod: { fontSize: 7.5, color: '#94A3B8', fontWeight: 700 },
    expCompany: { fontSize: 8.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginVertical: 2 },
    expDesc: { fontSize: 8, lineHeight: 1.45, color: '#475569' },
    eduItem: { marginBottom: 10 },
    eduHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    eduDegree: { fontSize: 9, fontWeight: 900, color: '#0F172A' },
    eduPeriod: { fontSize: 7.5, color: '#94A3B8', fontWeight: 700 },
    eduIns: { fontSize: 8, color: '#64748B', fontWeight: 700 },
    certItem: { marginBottom: 8 },
    certTitle: { fontSize: 8.5, fontWeight: 900, color: '#334155' },
    certDate: { fontSize: 7, color: '#94A3B8' },
    footer: { borderTop: '1pt solid #F1F5F9', paddingTop: 10, marginTop: 'auto', textAlign: 'center' },
    footerText: { fontSize: 7.5, color: '#94A3B8', letterSpacing: 1.5 }
  });

  return (
    <View style={styles.container}>
      <View style={styles.topHairline} />
      <View style={styles.header}>
        {data.styleConfig?.showPhoto !== false && (
          data.personalInfo.photo ? (
            <Image src={data.personalInfo.photo} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV'}
              </Text>
            </View>
          )
        )}
        <Text style={styles.name}>{data.personalInfo.fullName || 'Seu Nome'}</Text>
        <Text style={styles.title}>{data.personalInfo.title || 'Cargo Desejado'}</Text>
        <View style={styles.contactRow}>
          {data.personalInfo.phone && (
            <View style={styles.contactItem}>
              <Icons.Phone />
              <Text style={styles.contactText}>{data.personalInfo.phone}</Text>
            </View>
          )}
          {data.personalInfo.email && (
            <View style={styles.contactItem}>
              <Icons.Mail />
              <Text style={styles.contactText}>{data.personalInfo.email}</Text>
            </View>
          )}
          {data.personalInfo.location && (
            <View style={styles.contactItem}>
              <Icons.MapPin />
              <Text style={styles.contactText}>{data.personalInfo.location}</Text>
            </View>
          )}
        </View>
      </View>

      {data.personalInfo.summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>"{data.personalInfo.summary.replace(/\*/g, '')}"</Text>
        </View>
      )}

      <View style={styles.columns}>
        <View style={styles.leftCol}>
          {data.skills.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'skills', 'Competências')}</Text>
              {data.skills.filter(s => s && s.name).map((s, idx) => (
                <View key={s.id || `skill-${idx}`} style={styles.skillRow}>
                  <Text style={styles.skillName}>{s.name}</Text>
                  {s.level && s.level !== 'Ocultar' && <Text style={styles.skillLevel}>{s.level}</Text>}
                </View>
              ))}
            </View>
          )}

          {data.languages && data.languages.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'languages', 'Idiomas')}</Text>
              {data.languages.map((l, idx) => (
                <View key={l.id || `lang-${idx}`} style={styles.langRow}>
                  <Text style={styles.langName}>{l.name}</Text>
                  <Text style={styles.langLevel}>{l.level}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.rightCol}>
          {data.experience.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'experience', 'Experiência Profissional')}</Text>
              {data.experience.map((ex, idx) => (
                <View key={ex.id || `exp-${idx}`} style={[styles.expItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }]}>
                  <View style={styles.expHeader}>
                    <Text style={styles.expRole}>{ex.position}</Text>
                    <Text style={styles.expPeriod}>{ex.startDate} - {ex.current ? 'PRESENTE' : ex.endDate}</Text>
                  </View>
                  <Text style={styles.expCompany}>{ex.company}</Text>
                  <Text style={styles.expDesc}>{ex.description.replace(/\*/g, '')}</Text>
                </View>
              ))}
            </View>
          )}

          {data.education.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'education', 'Formação Acadêmica')}</Text>
              {data.education.map((e, idx) => (
                <View key={e.id || `edu-${idx}`} style={[styles.eduItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0, marginLeft: 0 }]}>
                  <View style={styles.eduHeader}>
                    <Text style={styles.eduDegree}>{e.degree}</Text>
                    <Text style={styles.eduPeriod}>{e.startDate} - {e.endDate}</Text>
                  </View>
                  <Text style={styles.eduIns}>{e.institution}</Text>
                </View>
              ))}
            </View>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>{getSectionTitle(data, 'certifications', 'Certificações')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {data.certifications.map((cVal, idx) => (
                  <View key={cVal.id || `cert-${idx}`} style={[styles.certItem, { width: '45%' }]}>
                    <Text style={styles.certTitle}>{cVal.name}</Text>
                    <Text style={styles.certDate}>{cVal.date}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <RenderCustomSections customSections={data.customSections} headingStyle={styles.sectionTitle} />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>CURRÍCULO PROFISSIONAL • {data.personalInfo.fullName ? data.personalInfo.fullName.toUpperCase() : 'CV'}</Text>
      </View>
    </View>
  );
};

const Template13 = ({ data }: { data: ResumeData }) => {
  const cTheme = data.themeColor || '#0B4F6C';
  const styles = StyleSheet.create({
    container: { flexDirection: 'column', height: '100%', backgroundColor: '#FAF9FB' },
    header: { backgroundColor: '#1E293B', padding: '25 30', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { flex: 1 },
    name: { fontSize: 26, fontWeight: 950, color: '#FFFFFF', textTransform: 'uppercase' },
    title: { fontSize: 9, fontWeight: 900, color: cTheme, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 },
    avatar: { width: 65, height: 65, borderRadius: 12, border: `2pt solid ${cTheme}`, objectFit: 'cover' },
    avatarPlaceholder: { width: 65, height: 65, borderRadius: 12, backgroundColor: '#334155', border: `2pt solid ${cTheme}`, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 20, fontWeight: 900, color: '#FFFFFF' },
    accentLine: { height: 4, backgroundColor: cTheme },
    columns: { flexDirection: 'row', flex: 1, padding: 15, gap: 15 },
    sidebar: { width: '33%', gap: 12 },
    mainContent: { width: '67%', gap: 12 },
    card: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, border: '1pt solid #E2E8F0' },
    sectionHeader: { fontSize: 8.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, borderBottom: `1.5pt solid ${cTheme}`, paddingBottom: 2, marginBottom: 8, color: '#1E293B' },
    contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    contactText: { fontSize: 7.5, color: '#475569', marginLeft: 6 },
    skillItem: { marginBottom: 6 },
    skillInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    skillName: { fontSize: 7.5, fontWeight: 700, color: '#334155' },
    skillLevel: { fontSize: 6.5, color: '#64748B' },
    skillBar: { height: 3, backgroundColor: '#F1F5F9', borderRadius: 1.5, overflow: 'hidden' },
    skillVal: { height: '100%', backgroundColor: cTheme, borderRadius: 1.5 },
    langItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    langName: { fontSize: 8, color: '#334155', fontWeight: 700 },
    langLevel: { fontSize: 7, color: '#64748B' },
    summaryText: { fontSize: 8, lineHeight: 1.4, color: '#475569' },
    rowItem: { borderLeft: `1.5pt solid ${cTheme}`, paddingLeft: 8, marginBottom: 10 },
    rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    rowHeading: { fontSize: 9, fontWeight: 900, color: '#1E293B' },
    rowPeriod: { fontSize: 7, color: '#94A3B8', fontWeight: 700 },
    rowSub: { fontSize: 7.5, fontWeight: 700, color: cTheme, marginVertical: 1.5 },
    rowDesc: { fontSize: 7.5, lineHeight: 1.35, color: '#475569' },
    certGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    certItem: { width: '48%', marginBottom: 4 },
    certVal: { fontSize: 8, fontWeight: 900, color: '#334155' },
    certDate: { fontSize: 6.5, color: '#64748B' },
    footer: { height: 18, backgroundColor: '#0F172A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15 },
    footerText: { fontSize: 6.5, color: '#64748B', fontWeight: 700 }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{data.personalInfo.fullName || 'Seu Nome'}</Text>
          <Text style={styles.title}>{data.personalInfo.title || 'Cargo Desejado'}</Text>
        </View>
        {data.styleConfig?.showPhoto !== false && (
          data.personalInfo.photo ? (
            <Image src={data.personalInfo.photo} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {data.personalInfo.fullName ? data.personalInfo.fullName.charAt(0).toUpperCase() : 'CV'}
              </Text>
            </View>
          )
        )}
      </View>
      <View style={styles.accentLine} />

      <View style={styles.columns}>
        <View style={styles.sidebar}>
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Contacto</Text>
            {data.personalInfo.phone && (
              <View style={styles.contactItem}>
                <Icons.Phone />
                <Text style={styles.contactText}>{data.personalInfo.phone}</Text>
              </View>
            )}
            {data.personalInfo.email && (
              <View style={styles.contactItem}>
                <Icons.Mail />
                <Text style={styles.contactText}>{data.personalInfo.email}</Text>
              </View>
            )}
            {data.personalInfo.location && (
              <View style={styles.contactItem}>
                <Icons.MapPin />
                <Text style={styles.contactText}>{data.personalInfo.location}</Text>
              </View>
            )}
          </View>

          {data.skills.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>{getSectionTitle(data, 'skills', 'Competências')}</Text>
              {data.skills.filter(s => s && s.name).map((s, idx) => {
                const value = s.level === 'Especialista' ? 100 : s.level === 'Avançado' ? 80 : s.level === 'Intermédio' ? 60 : s.level === 'Básico' ? 40 : s.level === 'Iniciante' ? 20 : 0;
                const showLevel = s.level && s.level !== 'Ocultar';
                return (
                  <View key={s.id || `skill-${idx}`} style={styles.skillItem}>
                    <View style={styles.skillInfo}>
                      <Text style={styles.skillName}>{s.name}</Text>
                      {showLevel && <Text style={styles.skillLevel}>{s.level}</Text>}
                    </View>
                    {showLevel && (
                      <View style={styles.skillBar}>
                        <View style={[styles.skillVal, { width: `${value}%` }]} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {data.languages && data.languages.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>{getSectionTitle(data, 'languages', 'Idiomas')}</Text>
              {data.languages.map((l, idx) => (
                <View key={l.id || `lang-${idx}`} style={styles.langItem}>
                  <Text style={styles.langName}>{l.name}</Text>
                  <Text style={styles.langLevel}>{l.level}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.mainContent}>
          {data.personalInfo.summary && (
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>{getSectionTitle(data, 'summary', 'Resumo Profissional')}</Text>
              <Text style={styles.summaryText}>{data.personalInfo.summary.replace(/\*/g, '')}</Text>
            </View>
          )}

          {data.experience.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>{getSectionTitle(data, 'experience', 'Experiência de Trabalho')}</Text>
              {data.experience.map((ex, idx) => (
                <View key={ex.id || `exp-${idx}`} style={[styles.rowItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.rowHeading}>{ex.position}</Text>
                    <Text style={styles.rowPeriod}>{ex.startDate} - {ex.current ? 'PRESENTE' : ex.endDate}</Text>
                  </View>
                  <Text style={styles.rowSub}>{ex.company}</Text>
                  <Text style={styles.rowDesc}>{ex.description.replace(/\*/g, '')}</Text>
                </View>
              ))}
            </View>
          )}

          {data.education.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>{getSectionTitle(data, 'education', 'Educação')}</Text>
              {data.education.map((e, idx) => (
                <View key={e.id || `edu-${idx}`} style={[styles.rowItem, data.styleConfig?.showTimeline === false && { borderLeft: 'none', paddingLeft: 0 }]}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.rowHeading}>{e.degree}</Text>
                    <Text style={styles.rowPeriod}>{e.startDate} - {e.endDate}</Text>
                  </View>
                  <Text style={[styles.rowSub, { color: '#64748B' }]}>{e.institution}</Text>
                </View>
              ))}
            </View>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>{getSectionTitle(data, 'certifications', 'Certificações')}</Text>
              <View style={styles.certGrid}>
                {data.certifications.map((cVal, idx) => (
                  <View key={cVal.id || `cert-${idx}`} style={styles.certItem}>
                    <Text style={styles.certVal}>{cVal.name}</Text>
                    <Text style={styles.certDate}>{cVal.date}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <RenderCustomSections customSections={data.customSections} headingStyle={styles.sectionHeader} cardStyle={styles.card} />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>CV LAB AUTOMATED GENERATOR</Text>
        <Text style={[styles.footerText, { color: cTheme }]}>● COMPLIANT WEB DESIGNS</Text>
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
          {templateId === 6 && <Template6 key="t6" data={data} />}
          {templateId === 7 && <Template7 key="t7" data={data} />}
          {templateId === 8 && <Template8 key="t8" data={data} />}
          {templateId === 9 && <Template9 key="t9" data={data} />}
          {templateId === 10 && <Template10 key="t10" data={data} />}
          {templateId === 11 && <Template11 key="t11" data={data} />}
          {templateId === 12 && <Template12 key="t12" data={data} />}
          {templateId === 13 && <Template13 key="t13" data={data} />}
        </>
      ) : (
        <CoverLetter data={data} />
      )}
    </Page>
  </Document>
);
