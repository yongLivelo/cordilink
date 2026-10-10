import {
  Modal,
  Stack,
  Group,
  Text,
  Title,
  Badge,
  Accordion,
  Card,
  Box,
  UnstyledButton,
  TextInput,
  ThemeIcon,
  Divider,
} from "@mantine/core";
import { useState, useMemo } from "react";

// CordiLink Brand Palette
const BRAND = {
  orange: "#FF3900",
  navy: "#003953",
  teal: "#027F8D",
  darkNavy: "#002436",
};

export type LanguageCode = "en" | "tl" | "ilo" | "knk" | "pag";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqStep {
  step: string;
  title: string;
  desc: string;
  subPoints?: { label: string; text: string; isUpvote?: boolean }[];
}

interface LanguageFaqData {
  code: LanguageCode;
  label: string;
  nativeName: string;
  title: string;
  subtitle: string;
  howToTitle: string;
  questions: FaqItem[];
  steps: FaqStep[];
}

const FAQ_DATA: Record<LanguageCode, LanguageFaqData> = {
  // PRIORITY 1: English (Default)
  en: {
    code: "en",
    label: "English",
    nativeName: "English",
    title: "Frequently Asked Questions (FAQ)",
    subtitle:
      "Everything you need to know about civic hazard reporting, AI classification, and deduplication in Baguio City.",
    howToTitle: "How to use CordiLink?",
    questions: [
      {
        q: "What is CordiLink?",
        a: "CordiLink is a smart governance platform built for Baguio City residents to quickly report non-emergency municipal hazards and track LGU resolution progress in real time.",
      },
      {
        q: "Can I use CordiLink to report emergencies?",
        a: "No. CordiLink is strictly for non-emergency civic hazards. For urgent life-threatening situations (medical, fire, crime), please call 911 directly.",
      },
      {
        q: "Is CordiLink available outside of Baguio City?",
        a: "Currently, CordiLink's prototype is configured exclusively for Baguio City barangays and specific Baguio LGU departments (e.g., CEPMO, CDRRMO).",
      },
      {
        q: "Why did the app ask me if my report is a duplicate?",
        a: "To keep local authorities from being overwhelmed by multiple submissions for the same incident, CordiLink automatically detects open tickets within 100 meters.",
      },
      {
        q: "Is my personal information shown on the public community board?",
        a: "No. To safeguard citizen privacy, personal details are hidden from the public view. The public community board displays only anonymized, AI-generated issue summaries, representative photos, and upvote counters.",
      },
      {
        q: "Can I cancel a report if the issue gets fixed on its own?",
        a: "Yes. You maintain full control of your active tickets and can revoke or edit them at any time through your tracking page.",
      },
    ],
    steps: [
      {
        step: "Step 1",
        title: "Capture the Issue",
        desc: "Open the app and take a photo of the non-emergency civic hazard. CordiLink will automatically log your precise GPS location and Baguio barangay.",
      },
      {
        step: "Step 2",
        title: "Brief Description",
        desc: "Describe the issue then multimodal AI will analyze your photo and description to propose a classification, which you review and approve before submission.",
      },
      {
        step: "Step 3",
        title: "Verification & Deduplication Check",
        desc: "Before posting, the system scans for existing open tickets within a 100-meter radius under the same category. If a matching report is found, the app will show you the existing ticket:",
        subPoints: [
          {
            label: "If it's the same issue",
            text: "Tap Confirm Match. Your submission will convert into an Upvote, boosting the issue's priority for LGU attention without creating duplicate tickets.",
            isUpvote: true,
          },
          {
            label: "If it's a different issue",
            text: "Proceed with submitting your new ticket.",
            isUpvote: false,
          },
        ],
      },
    ],
  },

  // PRIORITY 2: Tagalog / Filipino
  tl: {
    code: "tl",
    label: "Tagalog / Filipino",
    nativeName: "Filipino",
    title: "Mga Madalas Itanong (FAQ)",
    subtitle:
      "Alamin ang lahat tungkol sa pag-uulat ng mga hazard sa komunidad, AI classification, at deduplication sa Lungsod ng Baguio.",
    howToTitle: "Paano gamitin ang CordiLink?",
    questions: [
      {
        q: "Ano ang CordiLink?",
        a: "Ang CordiLink ay isang smart governance platform na ginawa para sa mga residente ng Baguio City upang mabilis na maipagbigay-alam ang mga non-emergency na problema sa komunidad at masubaybayan ang aksyon ng LGU sa real time.",
      },
      {
        q: "Maaari ko bang gamitin ang CordiLink para mag-report ng emergency?",
        a: "Hindi. Ang CordiLink ay para lamang sa mga hindi pangkagipitang (non-emergency) pampublikong peligro o usapin. Para sa buhay o kaligtasan, tumawag sa 911.",
      },
      {
        q: "Magagamit ba ang CordiLink sa labas ng Baguio City?",
        a: "Sa kasalukuyan, ang prototype ng CordiLink ay nakalaan lamang para sa mga barangay sa Baguio City at mga partikular na departamento ng Baguio LGU (hal. CEPMO, CDRRMO).",
      },
      {
        q: "Bakit itinatanong ng app kung doble ang aking report?",
        a: "Upang maiwasan ang pagka-overwhelm ng mga lokal na awtoridad sa maramihang ulat para sa iisang insidente, awtomatikong natutukoy ng CordiLink ang mga nakatutok na report sa loob ng 100 metro.",
      },
      {
        q: "Makikita ba ang aking personal na impormasyon sa pampublikong community board?",
        a: "Hindi. Upang protektahan ang privacy ng mamamayan, nakatago ang iyong personal na detalye. Ang pampublikong community board ay nagpapakita lamang ng mga anonymized at AI-generated na buod ng problema, larawan, at upvote counter.",
      },
      {
        q: "Maaari ko bang kanselahin ang ulat kung naayos na ito nang kusa?",
        a: "Oo. Hawak mo ang kumpletong kontrol sa iyong mga aktibong ulat at maaari mo itong bawiin o baguhin anumang oras sa pamamagitan ng iyong tracking page.",
      },
    ],
    steps: [
      {
        step: "Hakbang 1",
        title: "Kunan ng Larawan ang Problema",
        desc: "Buksan ang app at kumuha ng litrato ng non-emergency na peligro. Awtomatikong itatala ng CordiLink ang iyong eksaktong GPS location at barangay sa Baguio.",
      },
      {
        step: "Hakbang 2",
        title: "Maikling Paglalarawan",
        desc: "Ilarawan ang problema at susuriin ng multimodal AI ang iyong larawan at paglalarawan upang magmungkahi ng kategorya, na maaari mong suriin at aprubahan bago ipadala.",
      },
      {
        step: "Hakbang 3",
        title: "Pagpapatunay at Pagsusuri ng Duplikasyon",
        desc: "Bago maipost, mag-i-scan ang sistema para sa mga umiiral na ulat sa loob ng 100 metrong sakop sa ilalim ng parehong kategorya. Kung may mahanap na katulad:",
        subPoints: [
          {
            label: "Kung ito ay parehong problema",
            text: "Pindutin ang Confirm Match. Ang iyong ulat ay magiging isang Upvote, na magpapataas ng prayoridad nito sa LGU nang hindi gumagawa ng dobleng ulat.",
            isUpvote: true,
          },
          {
            label: "Kung ito ay ibang problema",
            text: "Ituloy ang pagpasa ng iyong bagong ulat.",
            isUpvote: false,
          },
        ],
      },
    ],
  },

  // PRIORITY 3: Ilocano (Ilokano)
  ilo: {
    code: "ilo",
    label: "Ilocano",
    nativeName: "Ilokano",
    title: "Ospisial a Saludsod ken Sungbat (FAQ)",
    subtitle:
      "Amin a masapulmo a maammuan maipapan iti panangipulong ti peligro ti komunidad, AI categorization, ken deduplication iti Baguio City.",
    howToTitle: "Kasepno nga usaren ti CordiLink?",
    questions: [
      {
        q: "Ania ti CordiLink?",
        a: "Ti CordiLink ket maysa a smart governance platform a naaramid para kadagiti residente ti Baguio City tapno nadaddadag a maipulong dagiti non-emergency a problema ti komunidad ken masubaybayan ti aksyon ti LGU iti real time.",
      },
      {
        q: "Mabalinko kadi nga usaren ti CordiLink nga ag-report ti emergency?",
        a: "Madi. Ti CordiLink ket para laeng kadagiti saan a pangkagipitan (non-emergency) a pasamak wenno peligro.",
      },
      {
        q: "Maitutop kadi ti CordiLink iti ruar ti Baguio City?",
        a: "Tatta nga gundaway, ti prototype ti CordiLink ket naisagana laeng para kadagiti barangay ti Baguio City ken dagiti partikular a departamento ti Baguio LGU (kas koma iti CEPMO, CDRRMO).",
      },
      {
        q: "Apay nga tinalianiawak ti app no ti reportko ket katulad wenno doble?",
        a: "Tapno maipaidam ti panagsagaba ti lokal nga autoridad iti adu a report iti maysa laeng a pasamak, ti CordiLink ket otomatiko a makatiktik kadagiti naitukit a report iti uneg ti 100 metro.",
      },
      {
        q: "Maiparang kadi ti personal nga impormasionko iti pampubliko a community board?",
        a: "Madi. Tapno maprotektaran ti privacy ti umili, ti personal nga detalye ket mailemmeng. Ti pampubliko a community board ket agiparang laeng kadagiti anonymized a summaries ti AI, ladawan, ken upvote counters.",
      },
      {
        q: "Mabalinko kadi nga ukaban ti report no naagapanen ti problema?",
        a: "Wen. Adda kenka ti naan-anay a kontrol kadagiti aktibo a reportmo ken mabalinmo nga ukaban wenno baliwam dagitoy iti uray ania a oras babaen ti tracking page-mo.",
      },
    ],
    steps: [
      {
        step: "Addang 1",
        title: "Alaen ti Ladawan ti Problema",
        desc: "Lukatanto ti app ken mangala iti litrato ti non-emergency a peligro. Otomatiko a mailetra ti CordiLink ti eksakto a GPS location ken barangaymo iti Baguio.",
      },
      {
        step: "Addang 2",
        title: "Babassit a Deskripsion",
        desc: "Ilawlawag ti usapin, kalpasan na ti multimodal AI ket anahisaranna ti ladawan ken deskripsionmo tapno mangatagumbalay ti kategorya, a rebyuem ken aprubaram bago maipasa.",
      },
      {
        step: "Addang 3",
        title: "Panag-beripika ken Pagsusuri ti Duplikasyon",
        desc: "Sardeng nga maipost, ti sistema ket ag-scan kadagiti nakalukat a report iti uneg ti 100 metro iti kapadpada a kategorya. No adda masarakan:",
        subPoints: [
          {
            label: "No kapadpada a problema",
            text: "Pinduten ti Confirm Match. Ti submission-mo ket maipabaliw a kas Upvote, tapno ingato ti prioridadna iti LGU nga awan ti nadoble a report.",
            isUpvote: true,
          },
          {
            label: "No sabali a problema",
            text: "Tuloyem ti panagpasa ti baro a reportmo.",
            isUpvote: false,
          },
        ],
      },
    ],
  },

  // PRIORITY 4: Kankanaey (Kankana-ey)
  knk: {
    code: "knk",
    label: "Kankanaey",
    nativeName: "Kankana-ey",
    title: "Dagiti Kanayon ay Masaludsod (FAQ)",
    subtitle:
      "Impormasyon para ed mga umili ti Baguio City maipanggep sinan panag-report ti peligro, AI lane, ken deduplication.",
    howToTitle: "Pano ay usaren nan CordiLink?",
    questions: [
      {
        q: "Ngag nan CordiLink?",
        a: "Nan CordiLink kay maysa ay smart governance platform ay naipanggep para ed mga umili ti Baguio City tapno maipakaammo a dagus nan non-emergency ay nalaka o peligro ed ili ken matugutan nan aksyon nan LGU ti real time.",
      },
      {
        q: "Mabalin nga usaren nan CordiLink para ed emergency?",
        a: "Adi. Nan CordiLink kay eksklusibo laeng para ed mga non-emergency ay peligro.",
      },
      {
        q: "Mabalin kadi nan CordiLink ed ruwar ti Baguio City?",
        a: "Tatta, nan prototype ti CordiLink kay para laeng ed barangay ti Baguio City ken sinan duma ay departamento ti Baguio LGU (gabay ed CEPMO, CDRRMO).",
      },
      {
        q: "Apay ay isaludsod nan app no naulit nan reportko?",
        a: "Tapno madi maburaboran nan LGU sinan napangina ay report para sin maysa ay pasamak, otomatiko ay matiktikan ti CordiLink nan nakasukat ay report ti uneg ti 100 meters.",
      },
      {
        q: "Maipaila kadi nan personal ay impormasyonko sin pampubliko ay community board?",
        a: "Adi. Tapno masalakniban nan privacy nan umili, nakatago nan personal ay detalye. Nan pampubliko ay community board kay agipaila laeng ti AI-generated ay buod, litrato, ken upvote counter.",
      },
      {
        q: "Mabalin ay ikanselar nan report no naagapanen?",
        a: "Wen. Wada kenka nan ganap ay kontrol sin aktibo ay reportmo ken mabalin ay ikanselar o balaliwan sin tracking page-mo.",
      },
    ],
    steps: [
      {
        step: "Hakbang 1",
        title: "Litratoen nan Problema",
        desc: "Lukatan nan app ken mangala ti litrato ti non-emergency ay peligro. Otomatiko ay igabay ti CordiLink nan GPS location ken barangay ti Baguio.",
      },
      {
        step: "Hakbang 2",
        title: "Maikling Paglalarawan / Deskripsyon",
        desc: "Ibagam nan problema tan anahisaren nan multimodal AI nan litrato ken deskripsyonmo tapno mangiyait ti kategorya ay rebyuem ken aprobahan bago maipasa.",
      },
      {
        step: "Hakbang 3",
        title: "Pagpapatunay at Pagsusuri",
        desc: "Madi pay maipost, mag-scan nan sistema sin nakalukat ay report ti uneg ti 100 meters. No wada kapadpada:",
        subPoints: [
          {
            label: "No pareho ay problema",
            text: "Pinduten nan Confirm Match. Mabalik ay Upvote nan reportmo tapno maipangato sin LGU.",
            isUpvote: true,
          },
          {
            label: "No sabali ay problema",
            text: "Ituloy nan pagpasa ti baro ay report.",
            isUpvote: false,
          },
        ],
      },
    ],
  },

  // PRIORITY 5: Pangasinan (Pangasinense)
  pag: {
    code: "pag",
    label: "Pangasinan",
    nativeName: "Pangasinense",
    title: "Mabitbet ya Tepet (FAQ)",
    subtitle:
      "Tulong tan pampaliwawa para ed saray residente na Baguio City nipaakar ed civic reporting, AI triage, tan automated deduplication.",
    howToTitle: "Panon ya usaren so CordiLink?",
    questions: [
      {
        q: "Anto so CordiLink?",
        a: "Say CordiLink ay maysa ya smart governance platform ya ginawa para ed saray residente na Baguio City pian maples ya maipabalita so saray non-emergency ya peligro ed baley tan manayan so aksyon na LGU ed real time.",
      },
      {
        q: "Nayari kon usaren so CordiLink para ed emergency?",
        a: "Andi. Say CordiLink ay para labat ed saray non-emergency ya peligro.",
      },
      {
        q: "Gagana kasi so CordiLink ed paway na Baguio City?",
        a: "Natan, say prototype na CordiLink ay para labat ed saray barangay na Baguio City tan partikular ya departamento na LGU (singa CEPMO, CDRRMO).",
      },
      {
        q: "Akin ya tepetang na app no pareho so report ko?",
        a: "Pian ag mabagbag so LGU ed amayamay ya ulat ed saksakhey ya pasamak, kusa ya nadetect na CordiLink so saray nakalukat ya report ed loob na 100 meters.",
      },
      {
        q: "Maipatnag kasi so personal impormasyon ko ed public community board?",
        a: "Andi. Pian naprotektaan so privacy, nakatago so personal detalyem. Say public board ay mangipatnag labat na AI-generated summary, litrato, tan upvote counter.",
      },
      {
        q: "Nayari kon kanselaen so report no na-aayos ala?",
        a: "On. Walad sika so kontrol ed saray aktibon report tan nayaring kanselaen o ubonen ed tracking page mo.",
      },
    ],
    steps: [
      {
        step: "Pangkat 1",
        title: "Litratoen so Problema",
        desc: "Lukasan so app tan mangala na litrato na non-emergency ya peligro. Kusang igabay na CordiLink so eksakton GPS location tan barangay ed Baguio.",
      },
      {
        step: "Pangkat 2",
        title: "Antikey ya Deskripsyon",
        desc: "Ipaantalang so peligro tan surien na multimodal AI so litrato tan salitam pian mangibaga na kategorya ya rebyuen tan aprubaan bago maipasa.",
      },
      {
        step: "Pangkat 3",
        title: "Verification & Deduplication",
        desc: "Bago maipost, mag-scan so sistema na nakalukat ya report ed loob na 100 meters. No walay kapara:",
        subPoints: [
          {
            label: "No parehon problema",
            text: "Pinduten so Confirm Match. Magmaliw ya Upvote so report mo pian maipangato ed LGU.",
            isUpvote: true,
          },
          {
            label: "No arom ya problema",
            text: "Ituloy so pagpasa na baon report.",
            isUpvote: false,
          },
        ],
      },
    ],
  },
};

const LANGUAGE_LIST: { code: LanguageCode; label: string; badge: string }[] = [
  { code: "en", label: "English", badge: "Primary" },
  { code: "tl", label: "Tagalog / Filipino", badge: "Filipino" },
  { code: "ilo", label: "Ilocano", badge: "Ilokano" },
  { code: "knk", label: "Kankanaey", badge: "Kankana-ey" },
  { code: "pag", label: "Pangasinan", badge: "Pangasinense" },
];

interface FaqModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function FaqModal({ opened, onClose }: FaqModalProps) {
  // Default language is English as requested ("Prio is english next is tagalog and ilocano and others")
  const [selectedLang, setSelectedLang] = useState<LanguageCode>("en");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const currentData = FAQ_DATA[selectedLang];

  // Optional in-modal search across questions
  const filteredQuestions = useMemo(() => {
    if (!searchFilter.trim()) return currentData.questions;
    const query = searchFilter.toLowerCase();
    return currentData.questions.filter(
      (item) =>
        item.q.toLowerCase().includes(query) ||
        item.a.toLowerCase().includes(query)
    );
  }, [currentData, searchFilter]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      radius="lg"
      padding="lg"
      centered
      title={
        <Group gap="xs" align="center">
          <Box
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: "rgba(2, 127, 141, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={BRAND.teal}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </Box>
          <Box>
            <Text fw={900} size="md" c={BRAND.navy} lh={1.1}>
              CordiLink Knowledge Hub
            </Text>
            <Text size="11px" fw={700} c={BRAND.teal} tt="uppercase">
              OFFICIAL CIVIC GUIDELINES
            </Text>
          </Box>
        </Group>
      }
      styles={{
        header: {
          borderBottom: "1px solid #EDF2F4",
          paddingBottom: "14px",
        },
        body: {
          paddingTop: "16px",
        },
      }}
    >
      <Stack gap="lg">
        {/* =========================================================================
            1. LANGUAGE SELECTOR (ENGLISH PRIORITY -> TAGALOG -> ILOCANO -> OTHERS)
            ========================================================================= */}
        <Box>
          <Group justify="space-between" align="center" mb={8} wrap="wrap">
            <Text size="xs" fw={800} c={BRAND.navy} tt="uppercase" style={{ letterSpacing: "0.5px" }}>
              Select Language / Piliin ang Wika:
            </Text>
            <Badge size="xs" color="teal" variant="light">
              5 Regional Dialects
            </Badge>
          </Group>

          <Group gap={6} wrap="wrap">
            {LANGUAGE_LIST.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <UnstyledButton
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 700,
                    backgroundColor: isSelected ? BRAND.teal : "#F1F5F7",
                    color: isSelected ? "#ffffff" : "#4A5568",
                    boxShadow: isSelected ? "0 2px 8px rgba(2, 127, 141, 0.3)" : "none",
                    border: isSelected ? "none" : "1px solid #E2E8F0",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#E5EDEF";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#F1F5F7";
                  }}
                >
                  <span>{lang.label}</span>
                  {isSelected && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                        display: "inline-block",
                      }}
                    />
                  )}
                </UnstyledButton>
              );
            })}
          </Group>
        </Box>

        {/* =========================================================================
            2. LOCALIZED BANNER HEADER
            ========================================================================= */}
        <Card
          radius="md"
          p="md"
          style={{
            background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.teal} 100%)`,
            color: "#ffffff",
          }}
        >
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Box>
              <Badge
                size="xs"
                variant="filled"
                style={{
                  backgroundColor: BRAND.orange,
                  color: "#ffffff",
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                {currentData.nativeName}
              </Badge>
              <Title order={3} size="h4" fw={900} c="#ffffff" lh={1.2}>
                {currentData.title}
              </Title>
              <Text size="xs" c="rgba(255, 255, 255, 0.88)" mt={4} lh={1.4}>
                {currentData.subtitle}
              </Text>
            </Box>
          </Group>
        </Card>

        {/* Quick Question Filter */}
        <TextInput
          placeholder={`Search ${currentData.label} questions...`}
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.currentTarget.value)}
          radius="md"
          size="xs"
          leftSection={
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#718096"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        />

        {/* =========================================================================
            3. FREQUENTLY ASKED QUESTIONS (ACCORDION)
            ========================================================================= */}
        <Box>
          <Text size="xs" fw={800} c={BRAND.navy} tt="uppercase" mb="xs" style={{ letterSpacing: "0.5px" }}>
            Common Questions & Answers:
          </Text>

          {filteredQuestions.length > 0 ? (
            <Accordion variant="separated" radius="md">
              {filteredQuestions.map((item, index) => (
                <Accordion.Item key={index} value={`item-${index}`} style={{ backgroundColor: "#FAFCFC" }}>
                  <Accordion.Control>
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size="xs" color="teal" variant="light" radius="xl">
                        <Text size="10px" fw={900}>
                          Q
                        </Text>
                      </ThemeIcon>
                      <Text size="sm" fw={700} c={BRAND.navy}>
                        {item.q}
                      </Text>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text size="xs" c="gray.7" lh={1.6} pl={28}>
                      {item.a}
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          ) : (
            <Card withBorder p="md" radius="md" style={{ textAlign: "center" }}>
              <Text size="xs" c="dimmed">
                No questions found matching "{searchFilter}".
              </Text>
            </Card>
          )}
        </Box>

        <Divider color="#EEF2F4" />

        {/* =========================================================================
            4. STEP-BY-STEP USER GUIDE (HOW TO USE CORDILINK)
            ========================================================================= */}
        <Box>
          <Group justify="space-between" align="center" mb="sm">
            <Text size="xs" fw={800} c={BRAND.orange} tt="uppercase" style={{ letterSpacing: "0.5px" }}>
              {currentData.howToTitle}
            </Text>
            <Badge size="xs" color="orange" variant="light">
              3-Step Workflow
            </Badge>
          </Group>

          <Stack gap="sm">
            {currentData.steps.map((stepItem, idx) => (
              <Card
                key={idx}
                withBorder
                radius="md"
                p="sm"
                style={{
                  backgroundColor: "#ffffff",
                  borderLeft: `4px solid ${idx === 2 ? BRAND.orange : BRAND.teal}`,
                }}
              >
                <Group align="flex-start" wrap="nowrap" gap="sm">
                  <Badge
                    size="xs"
                    color={idx === 2 ? "orange" : "teal"}
                    variant="filled"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    {stepItem.step}
                  </Badge>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={800} c={BRAND.navy}>
                      {stepItem.title}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2} lh={1.4}>
                      {stepItem.desc}
                    </Text>

                    {/* Deduplication funnel subpoints */}
                    {stepItem.subPoints && (
                      <Stack gap={6} mt="xs" pt={6} style={{ borderTop: "1px dashed #E2E8F0" }}>
                        {stepItem.subPoints.map((sub, sIdx) => (
                          <Box
                            key={sIdx}
                            p="xs"
                            style={{
                              backgroundColor: sub.isUpvote ? "#F0FDF4" : "#F8FAFC",
                              borderRadius: "6px",
                              border: sub.isUpvote ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
                            }}
                          >
                            <Text size="xs" fw={700} c={sub.isUpvote ? "green.9" : "gray.8"}>
                              • {sub.label}:
                            </Text>
                            <Text size="xs" c={sub.isUpvote ? "green.8" : "dimmed"} mt={1}>
                              {sub.text}
                            </Text>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Group>
              </Card>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Modal>
  );
}
