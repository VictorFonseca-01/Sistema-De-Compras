/**
 * Utilitários para gerenciar identidades compostas (Nome + Email).
 * Necessário para suportar e-mails compartilhados no Supabase Auth.
 */

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/[\s_-]+/g, '-') // Substitui espaços e underscores por hífens
    .replace(/^-+|-+$/g, ''); // Remove hífens no início e fim
}

/**
 * Gera um e-mail sintético único para o Supabase Auth.
 * Formato: slug-do-nome#email-real@globalp.com.br
 */
export function formatSyntheticEmail(name: string, email: string): string {
  if (!name || !email) return email;
  const slug = slugify(name);
  return `${slug}#${email.toLowerCase().trim()}`;
}
