-- Restauração do Acesso Master Admin - Victor Fonseca
-- E-mail: suporteti@globalp.com.br

UPDATE profiles 
SET 
  role = 'master_admin', 
  full_name = 'Victor Fonseca' 
WHERE email = 'suporteti@globalp.com.br';

-- Log de Auditoria
COMMENT ON TABLE profiles IS 'Perfil atualizado via script de recuperação de acesso master (Victor Fonseca)';
