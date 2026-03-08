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
};
