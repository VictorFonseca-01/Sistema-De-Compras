import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileBox, Download } from 'lucide-react';

export default function AssetImport() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate('/estoque')}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={14} /> Voltar ao Estoque
        </button>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Importação de Inventário</h1>
        <p className="text-slate-500 text-lg">Suba planilhas Excel para cadastrar ativos em lote.</p>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 p-20 text-center space-y-6">
         <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto text-slate-400">
            <FileBox size={40} />
         </div>
         <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Arraste sua planilha aqui</h3>
            <p className="text-slate-500 font-medium mt-1">Suporta arquivos .xlsx, .xls e .csv</p>
         </div>
         <div className="pt-4 flex flex-col items-center gap-4">
            <button className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95">
               SELECIONAR ARQUIVO
            </button>
            <button className="text-slate-400 hover:text-primary-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors">
               <Download size={14} /> Baixar Modelo de Exemplo
            </button>
         </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-8 rounded-[2rem] space-y-4">
         <h4 className="font-black text-blue-900 dark:text-blue-300 text-lg flex items-center gap-2">
            Padrão de Importação
         </h4>
         <p className="text-blue-700 dark:text-blue-400 font-medium">
            O sistema tentará mapear as colunas da sua planilha automaticamente. Certifique-se de que os números de patrimônio sejam únicos e sigam o padrão de 6 dígitos para evitar erros de validação.
         </p>
      </div>
    </div>
  );
}
