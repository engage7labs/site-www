/**
 * English (Ireland) Dictionary
 */

export const enIE = {
  // Navigation
  nav: {
    logo: "Engage7",
    getStarted: "Run Analysis",
  },

  // Homepage - Hero Section
  home: {
    hero: {
      title: "See what patterns in your life",
      titleHighlight: "are showing up in your body.",
      subtitle:
        "Engage7 turns your wearable data into clear insights about sleep, recovery, and movement—based on your own patterns.",
      ctaPrimary: "Run Analysis",
      ctaSecondary: "How It Works",
      trustBadge: "Clear insights from your data",
      trustLine1: "No account required",
      trustLine2: "Your data stays yours",
      trustLine3: "Results in ~1 minute",
    },

    // Three Pillars Section
    pillars: {
      sectionTitle: "Built for understanding",
      sectionSubtitle: "Clear insights you can trust and actually understand.",

      deterministic: {
        title: "Based on Your Patterns",
        description:
          "We find patterns in your data—not guesses. Every insight comes from what your body is actually showing.",
      },

      explainable: {
        title: "Easy to Understand",
        description:
          "See what's happening with your sleep, recovery, and movement. No jargon, no confusion.",
      },

      privacy: {
        title: "Your Data Stays Yours",
        description:
          "We analyze your data to give you insights, but we don't train AI models on it or share it with anyone.",
      },
    },

    // How Engage7 Works Section
    howItWorks: {
      sectionTitle: "How it works",
      sectionSubtitle:
        "Four simple steps from your wearable data to clear insights",

      step1: {
        title: "Upload your data",
        description: "Export from Apple Health and upload as a .zip file",
      },

      step2: {
        title: "We find your baseline",
        description:
          "We look at what's normal for you—not what's normal for everyone else",
      },

      step3: {
        title: "We spot the patterns",
        description:
          "We identify what's changed, what's consistent, and what stands out",
      },

      step4: {
        title: "You get clear insights",
        description:
          "See what your body is telling you, in plain language you can understand",
      },
    },

    // Example Report Section
    exampleReport: {
      sectionTitle: "What to expect",
      sectionSubtitle:
        "See what kind of insights you'll receive from your analysis",
      cardTitle: "Sample Analysis Report",
      cardSubtitle: "Example output structure",

      sampleSummary: {
        title: "Executive Summary",
        description:
          "High-level overview of key findings and patterns detected in your dataset",
      },

      sampleBaseline: {
        title: "Baseline Window",
        description:
          "Your individual physiological normal ranges for heart rate, HRV, and recovery",
      },

      sampleSignals: {
        title: "Key Signals",
        description:
          "Significant patterns, anomalies, or trends identified across sleep, activity, and recovery",
      },

      sampleStatus: {
        title: "Overall Pattern",
        description:
          "Context-aware assessment of your recent physiological state",
      },

      viewSampleCTA: "View sample report",
      learnMoreCTA: "Learn more about our methodology",
    },

    // FAQ Section
    faq: {
      sectionTitle: "Common questions",

      q1: {
        question: "What data can I upload?",
        answer:
          "Right now, we support Apple Health data. Just export it from your iPhone's Health app as a .zip file and upload it here.",
      },

      q2: {
        question: "What will I learn?",
        answer:
          "You'll see patterns in your sleep, heart rate, movement, and recovery—all based on what's normal for you, not general averages.",
      },

      q3: {
        question: "Do you use my data to train AI?",
        answer:
          "No. We analyze your data to give you insights, but we don't use it to train AI models or improve our algorithms.",
      },

      q4: {
        question: "Is this medical advice?",
        answer:
          "No. Engage7 helps you understand patterns in your data, but it's not a substitute for talking to a doctor.",
      },

      q5: {
        question: "How long does it take?",
        answer:
          "Most analyses finish in 30–90 seconds, depending on how much data you have.",
      },

      q6: {
        question: "What happens to my data after?",
        answer:
          "We keep your data temporarily to generate your report, then delete it. You always own your data.",
      },
    },

    // Technology Stack
    techStack: {
      title: "Built with trusted technologies",
    },

    // Community Activity
    communityActivity: {
      title: "Community Activity",
      totalUploads: "Total Analyses",
      recentUploads: "Analyses (24h)",
      languages: "Languages",
      loading: "Loading metrics...",
      error: "Metrics unavailable",
    },

    // Final CTA Section
    cta: {
      title: "Ready to understand your patterns?",
      subtitle:
        "Upload your data and see what your body's been trying to tell you.",
      ctaPrimary: "Run Analysis",
      ctaSecondary: "Learn How It Works",
    },

    // Footer
    footer: {
      copyright: "© 2026 Engage7 Labs. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      contact: "Contact",
      research: "Research",
    },
  },

  // Analyze Page
  analyze: {
    title: "Analyze your wearable data",
    subtitle:
      "Upload your data and we'll show you patterns in sleep, recovery, and movement based on what's normal for you.",

    workflow: {
      title: "How it works",
      step1: {
        title: "Upload Data",
        description: "Your Apple Health export file",
      },
      step2: {
        title: "We Analyze",
        description: "Find patterns based on your baseline",
      },
      step3: {
        title: "You Understand",
        description: "See clear insights about your body",
      },
    },

    upload: {
      title: "Upload your data",
      description: "Supported: Apple Health export (export.zip)",
      dragHint: "Drop your file here, or click to browse",
      fileSelected: "File ready:",
      analyzing: "Analyzing...",
      buttonUpload: "Upload & Analyze",
      buttonUploading: "Uploading...",
      buttonProcessing: "Processing...",
      formatHint: "Supported: Apple Health export (.zip)",
      expectationHint: "Usually takes 30–90 seconds.",
    },

    consent: {
      title: "Consent",
      description:
        "I confirm this data is mine and I'm OK with Engage7 analyzing it to generate insights.",
      disclaimer: "I understand this is informational and not medical advice.",
      linkText: "Read our Privacy Policy",
      required: "Please confirm to continue",
    },

    trust: {
      title: "Your data stays yours",
      point1: "Used only for your analysis",
      point2: "Not used to train AI",
      point3: "Clear, explainable results",
    },

    privacy: {
      title: "Your data stays yours",
      point1: "Only used for your analysis",
      point2: "Never used to train AI",
      point3: "Based on your own patterns",
      point4: "Clear and understandable",
    },

    backToHome: "Back to Home",
  },

  // Result Page
  result: {
    title: "Analysis Result",
    loading: "Loading your results...",

    status: {
      pending: "Processing",
      processing: "Analyzing your data",
      completed: "Analysis Complete",
      failed: "Analysis Failed",
    },

    summary: {
      title: "Executive Summary",
      datasetPeriod: "Dataset Period",
      recordsAnalyzed: "Records Analyzed",
      insightsGenerated: "Insights Generated",
    },

    insights: {
      title: "Key Insights",
      noInsights: "No insights available",
    },

    preview: {
      backToHome: "Back to Home",
      subtitle: "Your personal insight preview",
      sleepHero: {
        title: "Something interesting happened",
        titleHighlight: "in your sleep data.",
        emptyState:
          "Your sleep data has been analyzed. Explore your patterns below.",
        curiosPrompt: "Curious how this changed over time?",
        mobileCuriousPrompt: "Want to see what happened next?",
        ctaRecovery: "Explore your recovery",
      },
      sections: {
        sleepPattern: "Sleep Pattern",
        recovery: "Recovery",
        activityMobility: "Activity & Mobility",
      },
      cta: {
        exploreRecovery: "Explore recovery",
        exploreActivity: "Explore activity next",
        viewMovement: "View movement details",
      },
      emptyChart: "Not enough data to visualize.",
      emptyInsights: "Not enough data to generate this insight yet.",
      fullReport: {
        title: "Want the full picture?",
        description:
          "Your complete report includes detailed trends, correlations, and a downloadable PDF with all your insights.",
        downloadButton: "Download Full Report",
        runAnother: "Run another analysis",
      },
    },

    artifacts: {
      title: "Report & Artifacts",
      downloadPDF: "Download PDF Report",
      downloadData: "Download Processed Data",
    },

    error: {
      title: "Analysis Error",
      description:
        "An error occurred during analysis. Please try again or contact support.",
      retryButton: "Try Again",
    },

    backToAnalyze: "Run Another Analysis",
    backToHome: "Back to Home",
  },

  // Common
  common: {
    loading: "Loading...",
    error: "Error",
    retry: "Retry",
    cancel: "Cancel",
    close: "Close",
    next: "Next",
    previous: "Previous",
    viewDetails: "View Details",
  },

  // Privacy Policy
  privacyPolicy: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: March 8, 2026",
    intro:
      "Engage7 is committed to protecting your privacy. This policy explains how we handle your data when you use our analysis service.",
    sections: {
      dataCollection: {
        title: "Data Collection",
        content:
          "When you upload a dataset for analysis, we process the file to generate deterministic insights. You retain ownership of your data.",
      },
      dataUsage: {
        title: "Data Usage",
        content:
          "Your dataset is used solely to generate your analysis report. We do not train external AI models on your data. Processing follows deterministic rules based on physiological baselines.",
      },
      dataStorage: {
        title: "Data Storage",
        content:
          "Analysis results and uploaded files are temporarily stored to generate your report. We do not sell or share your data with third parties.",
      },
      dataRights: {
        title: "Your Rights",
        content:
          "You retain full ownership of your data. By default, Engage7 does not retain identifiable uploaded datasets or analysis results longer than operationally necessary. If persistent storage or account history features are introduced in the future, they will require your explicit consent and will be accompanied by updated privacy terms.",
      },
    },
    backToHome: "Back to Home",
  },

  // Terms of Service
  termsOfService: {
    title: "Terms of Service",
    lastUpdated: "Last updated: March 8, 2026",
    intro:
      "By using Engage7, you agree to these terms. Please read them carefully.",
    sections: {
      serviceDescription: {
        title: "Service Description",
        content:
          "Engage7 provides deterministic analysis of wearable health data. The service generates informational insights based on your physiological baseline.",
      },
      userResponsibilities: {
        title: "User Responsibilities",
        content:
          "You are responsible for ensuring that you have the right to upload any dataset you submit. You must own the data or have permission to process it.",
      },
      disclaimer: {
        title: "Medical Disclaimer",
        content:
          "Engage7 results are informational and do not constitute medical advice. Always consult qualified healthcare professionals for medical decisions.",
      },
      serviceChanges: {
        title: "Service Changes",
        content:
          "Engage7 may evolve over time. We reserve the right to modify or discontinue features as the service develops.",
      },
      limitation: {
        title: "Limitation of Liability",
        content:
          "Engage7 is provided as-is. We make no guarantees about the accuracy or completeness of analysis results.",
      },
    },
    backToHome: "Back to Home",
  },

  // Contact Page
  contact: {
    title: "Contact Us",
    subtitle: "Have questions? We'd love to hear from you.",
    linkedin: {
      heading: "Connect on LinkedIn",
      description:
        "Reach out to Rodrigo Marques on LinkedIn for questions, feedback, or collaboration opportunities.",
      button: "Open LinkedIn Profile",
    },
    backToHome: "Back to Home",
  },

  // Friends Page
  friends: {
    title: "Invite Friends",
    subtitle:
      "Share Engage7 with friends and help them understand their wearable data too.",
    shareTitle: "Share Engage7",
    shareDescription: "Choose a platform to share Engage7 with your network.",
    shareText:
      "I just analyzed my wearable data with Engage7 — deterministic insights from my physiological baseline. Try it yourself!",
    copyLink: "Copy Link",
    copied: "Copied!",
    backToHome: "Back to Home",

    socialProof: {
      title: "Community Activity",
      totalUploads: "Total Analyses",
      recentUploads: "Analyses (24h)",
      languages: "Languages",
      loading: "Loading metrics...",
      error: "Metrics unavailable",
    },
  },

  // Social Share
  socialShare: {
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    x: "X",
    instagram: "Instagram",
    copyLink: "Copy Link",
    copied: "Copied!",
  },
};

export type Dictionary = typeof enIE;
