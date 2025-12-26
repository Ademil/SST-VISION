
import { GoogleGenAI, Type } from "@google/genai";
import { TechnicalReport } from "../types";

const reportSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    identificacao: {
      type: Type.OBJECT,
      properties: {
        tipo_obra: { type: Type.STRING },
        data_analise: { type: Type.STRING },
        foto_referencia: { type: Type.STRING },
        responsavel: { type: Type.STRING }
      },
      required: ["tipo_obra", "data_analise", "foto_referencia", "responsavel"]
    },
    indicadores: {
      type: Type.OBJECT,
      properties: {
        conformidade_geral: { type: Type.NUMBER },
        prevencao_riscos: { type: Type.NUMBER }
      },
      required: ["conformidade_geral", "prevencao_riscos"]
    },
    parecer_ia: { type: Type.STRING },
    irregularidades: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item_numero: { type: Type.NUMBER },
          titulo: { type: Type.STRING },
          nr_referencia: { type: Type.STRING },
          risco_detalhado: { type: Type.STRING },
          acao_corretiva: { type: Type.STRING }
        },
        required: ["item_numero", "titulo", "nr_referencia", "risco_detalhado", "acao_corretiva"]
      }
    },
    conclusao: {
      type: Type.OBJECT,
      properties: {
        avaliacao_geral: { type: Type.STRING },
        continuidade: { type: Type.BOOLEAN },
        interdicao: { type: Type.STRING, enum: ["nenhuma", "parcial", "total"] }
      },
      required: ["avaliacao_geral", "continuidade", "interdicao"]
    }
  },
  required: ["id", "identificacao", "indicadores", "parecer_ia", "irregularidades", "conclusao"]
};

export async function analyzeConstructionSite(
  images: string[],
  metadata: { type?: string; stage?: string; location?: string; date?: string }
): Promise<TechnicalReport> {
  // Initializing inside the function ensures we use the most up-to-date process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts = images.map(base64 => ({
    inlineData: {
      data: base64.split(',')[1],
      mimeType: "image/jpeg"
    }
  }));

  const prompt = `
    Você é um Engenheiro de Segurança do Trabalho sênior. 
    Analise as fotos e gere um "RELATÓRIO DE INSPEÇÃO SST" técnico e rigoroso seguindo este modelo:

    1. Título: RELATÓRIO DE INSPEÇÃO SST
    2. Indicadores: Gere porcentagens realistas para "Nível de Conformidade Geral" e "Prevenção de Riscos".
    3. Parecer do Inspetor IA: Um texto técnico detalhado descrevendo a situação observada, identificando violações das NRs brasileiras (ex: NR-18, NR-35).
    4. Detalhamento das Irregularidades (NRs): 
       - Liste cada irregularidade numerada.
       - Use referências específicas (Ex: NR-35.5, NR-18.10).
       - Descreva o "Risco" detalhadamente.
       - Defina a "Ação Corretiva" imediata e preventiva.

    Dados contextuais:
    - Obra: ${metadata.type || 'Construção Civil'}
    - Etapa: ${metadata.stage || 'Execução'}
    - Data: ${metadata.date || new Date().toLocaleDateString('pt-BR')}

    Responda estritamente em JSON conforme o schema.
  `;

  try {
    // Switched to gemini-3-flash-preview for better reliability and faster processing of multimodal inputs.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [...imageParts, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema
      }
    });

    const report = JSON.parse(response.text) as TechnicalReport;
    report.data = new Date().toISOString();
    report.imagens = images;
    
    if (!report.id) report.id = `SST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    return report;
  } catch (error) {
    console.error("Erro na análise do Gemini:", error);
    throw new Error("Falha na comunicação com o servidor de IA. Tente enviar menos fotos ou fotos com menor resolução.");
  }
}
