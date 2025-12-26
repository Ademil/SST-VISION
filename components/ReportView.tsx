
import React, { useRef, useState } from 'react';
import { TechnicalReport } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportViewProps {
  report: TechnicalReport;
  hidePrintButton?: boolean;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, hidePrintButton = false }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`RELATORIO_SST_${report.identificacao.foto_referencia || 'ANALISE'}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Botão de Exportação - Fora do reportRef para não sair no PDF */}
      {!hidePrintButton && (
        <div className="flex justify-end no-pdf">
          <button 
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-8 py-3 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
          >
            {isExporting ? 'GERANDO DOCUMENTO...' : 'GERAR PDF DO RELATÓRIO'}
          </button>
        </div>
      )}

      {/* Área do Relatório - Seguindo o Modelo Visual */}
      <div ref={reportRef} className="bg-white p-12 shadow-2xl border border-slate-100 min-h-[1000px]">
        
        {/* Cabeçalho */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-medium text-[#10b981] tracking-widest uppercase">
            RELATÓRIO DE INSPEÇÃO SST
          </h1>
          <p className="text-slate-500 text-sm">
            Data: {report.identificacao.data_analise} | Foto: {report.identificacao.foto_referencia || 'inspeção_campo.jpg'}
          </p>
        </div>

        {/* Imagem Principal */}
        <div className="mb-12 relative group">
          <img 
            src={report.imagens[0]} 
            alt="Canteiro de Obras" 
            className="w-full rounded-sm shadow-md border border-slate-200"
          />
          {/* Marcadores simulados */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-xl">1</div>
          <div className="absolute bottom-1/4 left-1/3 w-8 h-8 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-xl">2</div>
        </div>

        {/* Indicadores */}
        <section className="mb-10 space-y-2">
          <h2 className="text-xl font-bold text-black border-b border-slate-100 pb-2 mb-4">Indicadores de Segurança</h2>
          <div className="space-y-1">
            <p className="text-slate-700">Nível de Conformidade Geral: <span className="font-semibold">{report.indicadores.conformidade_geral}%</span></p>
            <p className="text-slate-700">Prevenção de Riscos: <span className="font-semibold">{report.indicadores.prevencao_riscos}%</span></p>
          </div>
        </section>

        {/* Parecer do Inspetor */}
        <section className="mb-10 space-y-4">
          <h2 className="text-xl font-bold text-[#10b981] mb-2">Parecer do Inspetor IA</h2>
          <p className="text-slate-700 leading-relaxed text-justify">
            {report.parecer_ia}
          </p>
        </section>

        {/* Detalhamento das Irregularidades */}
        <section className="space-y-8">
          <h2 className="text-xl font-bold text-black border-b border-slate-100 pb-2">Detalhamento das Irregularidades (NRs)</h2>
          
          <div className="space-y-10">
            {report.irregularidades.map((item, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-lg font-bold text-red-600">
                  {item.item_numero}. {item.titulo} [{item.nr_referencia}]
                </h3>
                <div className="space-y-4 pl-1">
                  <p className="text-slate-700 leading-snug">
                    <span className="font-bold">Risco:</span> {item.risco_detalhado}
                  </p>
                  <p className="text-[#10b981] leading-snug">
                    <span className="font-bold">Ação Corretiva:</span> {item.acao_corretiva}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Conclusão Técnica Adicional */}
        <div className="mt-16 pt-8 border-t border-slate-100">
          <div className={`p-4 rounded-sm border ${report.conclusao.continuidade ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            <p className="font-bold uppercase text-xs tracking-widest mb-1">Status da Atividade</p>
            <p className="text-sm font-medium">{report.conclusao.avaliacao_geral}</p>
          </div>
        </div>

        {/* Rodapé Interno */}
        <div className="mt-20 text-center">
          <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em]">SST VISION PRO - RELATÓRIO TÉCNICO AUTOMATIZADO</p>
        </div>
      </div>
    </div>
  );
};
