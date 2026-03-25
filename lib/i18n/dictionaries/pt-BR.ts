/**
 * Portuguese (Brazil) Dictionary
 */

import type { Dictionary } from "./en-IE";

export const ptBR: Dictionary = {
  // Navigation
  nav: {
    logo: "Engage7",
    getStarted: "Executar Análise",
  },

  // Homepage - Hero Section
  home: {
    hero: {
      title: "Entenda seus dados de dispositivos vestíveis.",
      titleHighlight: "Claramente.",
      subtitle:
        "O Engage7 transforma sinais brutos de saúde em insights determinísticos construídos a partir da sua linha de base fisiológica.",
      ctaPrimary: "Executar Análise",
      ctaSecondary: "Como Funciona",
      trustBadge: "Insights determinísticos dos seus dados",
      trustLine1: "Sem necessidade de conta",
      trustLine2: "Seus dados permanecem seus",
      trustLine3: "Análise ~1 minuto",
    },

    // Three Pillars Section
    pillars: {
      sectionTitle: "Três pilares de clareza",
      sectionSubtitle:
        "Projetado para fornecer insights explicáveis em que você pode confiar.",

      deterministic: {
        title: "Análise Determinística",
        description:
          "Sem previsões de caixa-preta. Insights derivados de linhas de base fisiológicas mensuráveis.",
      },

      explainable: {
        title: "Sinais Explicáveis",
        description:
          "Entenda tendências em sono, frequência cardíaca, atividade e recuperação através de análise transparente.",
      },

      privacy: {
        title: "Privacidade por Design",
        description:
          "Seu conjunto de dados permanece seu. O Engage7 processa sinais sem treinar modelos de IA externos com seus dados.",
      },
    },

    // How Engage7 Works Section
    howItWorks: {
      sectionTitle: "Como o Engage7 funciona",
      sectionSubtitle:
        "Quatro etapas dos dados brutos para insights claros e explicáveis",

      step1: {
        title: "Carregar conjunto de dados",
        description:
          "Forneça sua exportação do Apple Health como um arquivo .zip padrão",
      },

      step2: {
        title: "Detectar linha de base fisiológica",
        description:
          "O Engage7 analisa seus padrões individuais para estabelecer suas faixas normais",
      },

      step3: {
        title: "Aplicar regras determinísticas",
        description:
          "Regras de processamento transparentes identificam sinais e tendências significativos",
      },

      step4: {
        title: "Gerar resumo de insights",
        description:
          "Receba um relatório claro e acionável com descobertas explicáveis",
      },
    },

    // Example Report Section
    exampleReport: {
      sectionTitle: "O que esperar",
      sectionSubtitle: "Veja que tipo de insights você receberá da sua análise",
      cardTitle: "Relatório de Análise de Exemplo",
      cardSubtitle: "Estrutura de saída de exemplo",

      sampleSummary: {
        title: "Resumo Executivo",
        description:
          "Visão geral de alto nível das principais descobertas e padrões detectados no seu conjunto de dados",
      },

      sampleBaseline: {
        title: "Janela de Linha de Base",
        description:
          "Suas faixas normais fisiológicas individuais para frequência cardíaca, HRV e recuperação",
      },

      sampleSignals: {
        title: "Sinais Principais",
        description:
          "Padrões, anomalias ou tendências significativas identificadas em sono, atividade e recuperação",
      },

      sampleStatus: {
        title: "Padrão Geral",
        description:
          "Avaliação consciente do contexto do seu estado fisiológico recente",
      },

      viewSampleCTA: "Ver relatório de exemplo",
      learnMoreCTA: "Saiba mais sobre nossa metodologia",
    },

    // FAQ Section
    faq: {
      sectionTitle: "Perguntas Frequentes",

      q1: {
        question: "Quais dados posso carregar?",
        answer:
          "Atualmente, o Engage7 suporta exportações do Apple Health. Exporte seus dados como um arquivo .zip do aplicativo Saúde no seu iPhone e carregue-o aqui.",
      },

      q2: {
        question: "Que tipo de insights vou receber?",
        answer:
          "Você receberá um relatório de análise determinística cobrindo padrões de sono, variabilidade da frequência cardíaca, tendências de atividade e sinais de recuperação. Todos os insights são explicáveis e derivados da sua linha de base fisiológica.",
      },

      q3: {
        question: "Meus dados são usados para treinar modelos de IA?",
        answer:
          "Não. Seu conjunto de dados é processado usando regras determinísticas para gerar sua análise pessoal. Não treinamos modelos de IA externos com seus dados.",
      },

      q4: {
        question: "Isso é aconselhamento médico?",
        answer:
          "Não. O Engage7 fornece apenas insights informativos. Os resultados não constituem aconselhamento médico e não devem substituir a consulta com profissionais de saúde qualificados.",
      },

      q5: {
        question: "Quanto tempo leva a análise?",
        answer:
          "A maioria das análises é concluída em 30–90 segundos, dependendo do tamanho do seu conjunto de dados.",
      },

      q6: {
        question: "O que acontece com meus dados após a análise?",
        answer:
          "Seu arquivo carregado e resultados de análise são armazenados temporariamente para gerar seu relatório. Você mantém a propriedade total dos seus dados e pode solicitar a exclusão a qualquer momento.",
      },
    },

    // Technology Stack
    techStack: {
      title: "Construído com tecnologias confiáveis",
    },

    // Community Activity
    communityActivity: {
      title: "Atividade da Comunidade",
      totalUploads: "Total de Análises",
      recentUploads: "Análises (24h)",
      languages: "Idiomas",
      loading: "Carregando métricas...",
      error: "Métricas indisponíveis",
    },

    // Final CTA Section
    cta: {
      title: "Pronto para entender seus dados?",
      subtitle:
        "Carregue seu conjunto de dados, execute uma análise determinística e revise um resultado claro em que você pode confiar.",
      ctaPrimary: "Executar Análise",
      ctaSecondary: "Saiba Como Funciona",
    },

    // Footer
    footer: {
      copyright: "© 2026 Engage7 Labs. Todos os direitos reservados.",
      privacy: "Política de Privacidade",
      terms: "Termos de Serviço",
      contact: "Contato",
      research: "Pesquisa",
    },
  },

  // Analyze Page
  analyze: {
    title: "Execute sua análise Engage7",
    subtitle:
      "Carregue seu conjunto de dados de dispositivos vestíveis para gerar um resumo de insights determinístico e explicável baseado na sua linha de base fisiológica.",

    workflow: {
      title: "Como funciona",
      step1: {
        title: "Carregar Dados",
        description: "Forneça sua exportação do Apple Health",
      },
      step2: {
        title: "Processamento",
        description: "Análise determinística executada em seus dados",
      },
      step3: {
        title: "Resultados",
        description: "Revise insights explicáveis e tendências",
      },
    },

    upload: {
      title: "Carregue seu conjunto de dados",
      description: "Formato suportado: exportação do Apple Health (export.zip)",
      dragHint: "Arraste e solte seu arquivo aqui, ou clique para procurar",
      fileSelected: "Arquivo selecionado:",
      analyzing: "Analisando...",
      buttonUpload: "Carregar e Analisar",
      buttonUploading: "Carregando...",
      buttonProcessing: "Processando...",
      formatHint: "Formato suportado: exportação do Apple Health (.zip)",
      expectationHint: "A análise geralmente é concluída em 30–90 segundos.",
    },

    consent: {
      title: "Consentimento para processamento de dados",
      description:
        "Confirmo que este conjunto de dados me pertence e autorizo o Engage7 a processá-lo com o objetivo de gerar um relatório de análise determinístico.",
      disclaimer:
        "Entendo que os resultados são informativos e não constituem aconselhamento médico.",
      linkText: "Leia nossa Política de Privacidade",
      required: "Você deve consentir para continuar",
    },

    trust: {
      title: "Seus dados permanecem seus",
      point1: "Arquivo usado apenas para esta análise",
      point2: "Sem treinamento de modelos de IA externos",
      point3: "Regras de processamento determinísticas",
    },

    privacy: {
      title: "Seus dados permanecem seus",
      point1: "Seu arquivo é usado apenas para análise",
      point2: "Sem treinamento em modelos de IA externos",
      point3: "Processamento segue regras determinísticas",
      point4: "Resultados gerados a partir da sua linha de base fisiológica",
    },

    backToHome: "Voltar para Início",
  },

  // Result Page
  result: {
    title: "Resultado da Análise",
    loading: "Carregando seus resultados...",

    status: {
      pending: "Processando",
      processing: "Analisando seus dados",
      completed: "Análise Concluída",
      failed: "Análise Falhou",
    },

    summary: {
      title: "Resumo Executivo",
      datasetPeriod: "Período do Conjunto de Dados",
      recordsAnalyzed: "Registros Analisados",
      insightsGenerated: "Insights Gerados",
    },

    insights: {
      title: "Principais Insights",
      noInsights: "Nenhum insight disponível",
    },

    preview: {
      backToHome: "Voltar para Início",
      subtitle: "Sua prévia de insights pessoais",
      sleepHero: {
        title: "Algo interessante aconteceu",
        titleHighlight: "nos seus dados de sono.",
        emptyState:
          "Seus dados de sono foram analisados. Explore seus padrões abaixo.",
        curiosPrompt: "Curioso para ver como isso mudou ao longo do tempo?",
        mobileCuriousPrompt: "Quer ver o que aconteceu em seguida?",
        ctaRecovery: "Explorar sua recuperação",
      },
      sections: {
        sleepPattern: "Padrão de Sono",
        recovery: "Recuperação",
        activityMobility: "Atividade e Mobilidade",
      },
      cta: {
        exploreRecovery: "Explorar recuperação",
        exploreActivity: "Explorar atividade",
        viewMovement: "Ver detalhes de movimento",
      },
      emptyChart: "Dados insuficientes para visualizar.",
      emptyInsights: "Dados insuficientes para gerar este insight ainda.",
      fullReport: {
        title: "Quer ver o panorama completo?",
        description:
          "Seu relatório completo inclui tendências detalhadas, correlações e um PDF para download com todos os seus insights.",
        downloadButton: "Baixar Relatório Completo",
        runAnother: "Executar outra análise",
      },
    },

    artifacts: {
      title: "Relatório e Artefatos",
      downloadPDF: "Baixar Relatório PDF",
      downloadData: "Baixar Dados Processados",
    },

    error: {
      title: "Erro na Análise",
      description:
        "Ocorreu um erro durante a análise. Por favor, tente novamente ou entre em contato com o suporte.",
      retryButton: "Tentar Novamente",
    },

    backToAnalyze: "Executar Outra Análise",
    backToHome: "Voltar para Início",
  },

  // Common
  common: {
    loading: "Carregando...",
    error: "Erro",
    retry: "Tentar Novamente",
    cancel: "Cancelar",
    close: "Fechar",
    next: "Próximo",
    previous: "Anterior",
    viewDetails: "Ver Detalhes",
  },

  // Privacy Policy
  privacyPolicy: {
    title: "Política de Privacidade",
    lastUpdated: "Última atualização: 8 de março de 2026",
    intro:
      "O Engage7 está comprometido em proteger sua privacidade. Esta política explica como lidamos com seus dados ao usar nosso serviço de análise.",
    sections: {
      dataCollection: {
        title: "Coleta de Dados",
        content:
          "Quando você carrega um conjunto de dados para análise, processamos o arquivo para gerar insights determinísticos. Você mantém a propriedade de seus dados.",
      },
      dataUsage: {
        title: "Uso de Dados",
        content:
          "Seu conjunto de dados é usado exclusivamente para gerar seu relatório de análise. Não treinamos modelos de IA externos com seus dados. O processamento segue regras determinísticas baseadas em linhas de base fisiológicas.",
      },
      dataStorage: {
        title: "Armazenamento de Dados",
        content:
          "Os resultados da análise e arquivos carregados são armazenados temporariamente para gerar seu relatório. Não vendemos nem compartilhamos seus dados com terceiros.",
      },
      dataRights: {
        title: "Seus Direitos",
        content:
          "Você mantém a propriedade total de seus dados. Por padrão, o Engage7 não retém conjuntos de dados identificáveis ou resultados de análise além do operacionalmente necessário. Se recursos de armazenamento persistente ou histórico de conta forem introduzidos no futuro, eles exigirão seu consentimento explícito e serão acompanhados de termos de privacidade atualizados.",
      },
    },
    backToHome: "Voltar para Início",
  },

  // Terms of Service
  termsOfService: {
    title: "Termos de Serviço",
    lastUpdated: "Última atualização: 8 de março de 2026",
    intro:
      "Ao usar o Engage7, você concorda com estes termos. Por favor, leia-os com atenção.",
    sections: {
      serviceDescription: {
        title: "Descrição do Serviço",
        content:
          "O Engage7 fornece análise determinística de dados de saúde de dispositivos vestíveis. O serviço gera insights informativos baseados em sua linha de base fisiológica.",
      },
      userResponsibilities: {
        title: "Responsabilidades do Usuário",
        content:
          "Você é responsável por garantir que tem o direito de carregar qualquer conjunto de dados que enviar. Você deve ser o proprietário dos dados ou ter permissão para processá-los.",
      },
      disclaimer: {
        title: "Aviso Médico",
        content:
          "Os resultados do Engage7 são informativos e não constituem aconselhamento médico. Sempre consulte profissionais de saúde qualificados para decisões médicas.",
      },
      serviceChanges: {
        title: "Alterações no Serviço",
        content:
          "O Engage7 pode evoluir com o tempo. Reservamos o direito de modificar ou descontinuar recursos à medida que o serviço se desenvolve.",
      },
      limitation: {
        title: "Limitação de Responsabilidade",
        content:
          "O Engage7 é fornecido como está. Não fazemos garantias sobre a precisão ou completude dos resultados da análise.",
      },
    },
    backToHome: "Voltar para Início",
  },

  // Contact Page
  contact: {
    title: "Entre em Contato",
    subtitle: "Tem perguntas? Adoraríamos ouvir de você.",
    linkedin: {
      heading: "Conecte-se no LinkedIn",
      description:
        "Entre em contato com Rodrigo Marques no LinkedIn para perguntas, feedback ou oportunidades de colaboração.",
      button: "Abrir Perfil no LinkedIn",
    },
    backToHome: "Voltar para Início",
  },

  // Friends Page
  friends: {
    title: "Convide Amigos",
    subtitle:
      "Compartilhe o Engage7 com amigos e ajude-os a entender seus dados de dispositivos vestíveis também.",
    shareTitle: "Compartilhar Engage7",
    shareDescription:
      "Escolha uma plataforma para compartilhar o Engage7 com sua rede.",
    shareText:
      "Acabei de analisar meus dados de dispositivos vestíveis com o Engage7 — insights determinísticos da minha linha de base fisiológica. Experimente você também!",
    copyLink: "Copiar Link",
    copied: "Copiado!",
    backToHome: "Voltar para Início",

    socialProof: {
      title: "Atividade da Comunidade",
      totalUploads: "Total de Análises",
      recentUploads: "Análises (24h)",
      languages: "Idiomas",
      loading: "Carregando métricas...",
      error: "Métricas indisponíveis",
    },
  },

  // Social Share
  socialShare: {
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    x: "X",
    instagram: "Instagram",
    copyLink: "Copiar Link",
    copied: "Copiado!",
  },
};
