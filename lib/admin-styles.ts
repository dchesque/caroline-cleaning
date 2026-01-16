/**
 * Estilos padronizados para o módulo admin
 * Garantem consistência visual em todos os formulários
 */

export const adminInputStyles = {
  /** Input padrão - fundo branco com bordas suaves */
  input: "bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400",

  /** Textarea padrão - mesmo estilo do input sem resize */
  textarea: "bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400 resize-none",

  /** Select trigger - fundo branco com bordas suaves */
  select: "bg-white border-gray-200 shadow-sm",

  /** Checkbox - cor da marca */
  checkbox: "border-gray-300 text-brandy-rose-500 focus:ring-brandy-rose-400",

  /** Switch - cor da marca quando ativo */
  switch: "data-[state=checked]:bg-brandy-rose-500",
}

/** Classes completas para uso direto */
export const adminStyles = {
  input: "bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400",
  textarea: "bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400 resize-none",
  select: "bg-white border-gray-200 shadow-sm",
  checkbox: "border-gray-300 text-brandy-rose-500 focus:ring-brandy-rose-400",
  switch: "data-[state=checked]:bg-brandy-rose-500",
}
