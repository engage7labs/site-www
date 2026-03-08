/**
 * Hindi (India) Dictionary
 */

import type { Dictionary } from "./en-IE";

export const hiIN: Dictionary = {
  // Navigation
  nav: {
    logo: "Engage7",
    getStarted: "विश्लेषण चलाएं",
  },

  // Homepage - Hero Section
  home: {
    hero: {
      title: "अपने पहनने योग्य डेटा को समझें।",
      titleHighlight: "स्पष्ट रूप से।",
      subtitle:
        "Engage7 आपके शारीरिक आधार रेखा से निर्मित निश्चित अंतर्दृष्टि में कच्चे स्वास्थ्य संकेतों को बदल देता है।",
      ctaPrimary: "विश्लेषण चलाएं",
      ctaSecondary: "यह कैसे काम करता है",
      trustBadge: "आपके डेटा से निश्चित अंतर्दृष्टि",
    },

    // Three Pillars Section
    pillars: {
      sectionTitle: "स्पष्टता के तीन स्तंभ",
      sectionSubtitle: "विश्वसनीय अंतर्दृष्टि प्रदान करने के लिए बनाया गया।",

      deterministic: {
        title: "निश्चित विश्लेषण",
        description:
          "कोई ब्लैक-बॉक्स पूर्वानुमान नहीं। मापने योग्य शारीरिक आधार रेखाओं से प्राप्त अंतर्दृष्टि।",
      },

      explainable: {
        title: "व्याख्या योग्य संकेत",
        description:
          "पारदर्शी विश्लेषण के माध्यम से नींद, हृदय गति, गतिविधि और रिकवरी में रुझानों को समझें।",
      },

      privacy: {
        title: "डिज़ाइन द्वारा गोपनीयता",
        description:
          "आपका डेटासेट आपका रहता है। Engage7 आपके डेटा पर बाहरी AI मॉडल को प्रशिक्षित किए बिना संकेतों को संसाधित करता है।",
      },
    },

    // Final CTA Section
    cta: {
      title: "अपने डेटा को समझने के लिए तैयार हैं?",
      subtitle:
        "अपना डेटासेट अपलोड करें, एक निश्चित विश्लेषण चलाएं, और एक स्पष्ट परिणाम की समीक्षा करें जिस पर आप भरोसा कर सकते हैं।",
      ctaPrimary: "विश्लेषण चलाएं",
      ctaSecondary: "जानें यह कैसे काम करता है",
    },

    // Footer
    footer: {
      copyright: "© 2026 Engage7 Labs. सर्वाधिकार सुरक्षित।",
      privacy: "गोपनीयता नीति",
      terms: "सेवा की शर्तें",
      contact: "संपर्क करें",
    },
  },

  // Analyze Page
  analyze: {
    title: "अपना Engage7 विश्लेषण चलाएं",
    subtitle:
      "अपने शारीरिक आधार रेखा के आधार पर एक निश्चित, व्याख्या योग्य अंतर्दृष्टि संक्षेप उत्पन्न करने के लिए अपना पहनने योग्य डेटासेट अपलोड करें।",

    workflow: {
      title: "यह कैसे काम करता है",
      step1: {
        title: "डेटासेट अपलोड करें",
        description: "अपना Apple Health निर्यात प्रदान करें",
      },
      step2: {
        title: "प्रसंस्करण",
        description: "आपके डेटा पर निश्चित विश्लेषण चलाया जाता है",
      },
      step3: {
        title: "परिणाम",
        description: "व्याख्या योग्य अंतर्दृष्टि और रुझानों की समीक्षा करें",
      },
    },

    upload: {
      title: "अपना डेटासेट अपलोड करें",
      description: "समर्थित प्रारूप: Apple Health निर्यात (export.zip)",
      dragHint:
        "अपनी फ़ाइल यहाँ खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें",
      fileSelected: "फ़ाइल चयनित:",
      analyzing: "विश्लेषण कर रहे हैं...",
      buttonUpload: "अपलोड करें और विश्लेषण करें",
      buttonUploading: "अपलोड हो रहा है...",
      buttonProcessing: "प्रसंस्करण हो रहा है...",
    },

    privacy: {
      title: "आपका डेटा आपका रहता है",
      point1: "आपकी फ़ाइल का उपयोग केवल विश्लेषण के लिए किया जाता है",
      point2: "बाहरी AI मॉडल पर कोई प्रशिक्षण नहीं",
      point3: "प्रसंस्करण निश्चित नियमों का पालन करता है",
      point4: "परिणाम आपकी शारीरिक आधार रेखा से उत्पन्न होते हैं",
    },

    backToHome: "होम पर वापस जाएं",
  },

  // Result Page
  result: {
    title: "विश्लेषण परिणाम",
    loading: "आपके परिणाम लोड हो रहे हैं...",

    status: {
      pending: "प्रसंस्करण",
      processing: "आपके डेटा का विश्लेषण कर रहे हैं",
      completed: "विश्लेषण पूर्ण",
      failed: "विश्लेषण विफल",
    },

    summary: {
      title: "कार्यकारी सारांश",
      datasetPeriod: "डेटासेट अवधि",
      recordsAnalyzed: "रिकॉर्ड विश्लेषित",
      insightsGenerated: "अंतर्दृष्टि उत्पन्न",
    },

    insights: {
      title: "प्रमुख अंतर्दृष्टि",
      noInsights: "कोई अंतर्दृष्टि उपलब्ध नहीं",
    },

    artifacts: {
      title: "रिपोर्ट और कलाकृतियाँ",
      downloadPDF: "PDF रिपोर्ट डाउनलोड करें",
      downloadData: "प्रसंस्कृत डेटा डाउनलोड करें",
    },

    error: {
      title: "विश्लेषण त्रुटि",
      description:
        "विश्लेषण के दौरान एक त्रुटि हुई। कृपया पुनः प्रयास करें या समर्थन से संपर्क करें।",
      retryButton: "पुनः प्रयास करें",
    },

    backToAnalyze: "एक और विश्लेषण चलाएं",
    backToHome: "होम पर वापस जाएं",
  },

  // Common
  common: {
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    retry: "पुनः प्रयास करें",
    cancel: "रद्द करें",
    close: "बंद करें",
    next: "अगला",
    previous: "पिछला",
    viewDetails: "विवरण देखें",
  },
};
