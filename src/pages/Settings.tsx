import { useState, useEffect, useRef, useCallback } from 'react';
import { ManageAccounts, Delete, CloudUpload, Settings as SettingsIcon, Close, ArrowBack } from '@mui/icons-material';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseAvailable } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languages = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
];

const timezones = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
  { value: 'Europe/Lisbon', label: 'Lisboa (GMT+0)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
  { value: 'Asia/Tokyo', label: 'Tóquio (GMT+9)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
];

type SettingsSection = 'account' | 'preferences';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const { settings, updateSettings } = useUserSettings();
  const { user, profile, updateEmail, updatePassword, refreshProfile, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  // Inicializar displayName com o nome do perfil se não houver um salvo
  const initialDisplayName = settings.displayName || profile?.full_name || user?.email?.split('@')[0] || '';
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [language, setLanguage] = useState(settings.language);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [avatarUrl, setAvatarUrl] = useState(settings.avatarUrl);
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const AVATAR_BUCKET = 'avatars';
  const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif'];

  // Revogar object URL ao desmontar para evitar vazamento de memória
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Sincronizar avatar do perfil para settings quando carregar (ex.: outro dispositivo)
  useEffect(() => {
    if (profile?.avatar_url && !settings.avatarUrl) {
      updateSettings({ avatarUrl: profile.avatar_url });
    }
  }, [profile?.avatar_url, settings.avatarUrl, updateSettings]);

  // Atualizar campos quando as configurações ou perfil mudarem
  useEffect(() => {
    // Atualizar displayName apenas se não houver mudanças locais não salvas
    const currentDisplayName = settings.displayName || profile?.full_name || user?.email?.split('@')[0] || '';
    if (displayName !== currentDisplayName && displayName === settings.displayName) {
      setDisplayName(currentDisplayName);
    }
    if (language !== settings.language) {
      setLanguage(settings.language);
    }
    if (timezone !== settings.timezone) {
      setTimezone(settings.timezone);
    }
    if (avatarUrl !== settings.avatarUrl) {
      setAvatarUrl(settings.avatarUrl);
    }
  }, [settings, profile, user, displayName, language, timezone]);

  // Atualizar email quando user mudar
  useEffect(() => {
    if (user?.email && email !== user.email) {
      setEmail(user.email);
    }
  }, [user, email]);

  // Verificar se há mudanças
  useEffect(() => {
    const changed =
      displayName !== settings.displayName ||
      language !== settings.language ||
      timezone !== settings.timezone ||
      avatarUrl !== settings.avatarUrl ||
      (user?.email && email !== user.email) ||
      newPassword.length > 0 ||
      currentPassword.length > 0;
    setHasChanges(changed);
  }, [displayName, language, timezone, avatarUrl, settings, email, user, newPassword, currentPassword]);

  // ESC key para fechar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);


  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab as EventListener);
    firstElement?.focus();

    return () => modal.removeEventListener('keydown', handleTab as EventListener);
  }, []);

  // Validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    // Validar email se foi alterado
    if (user?.email && email !== user.email) {
      if (!validateEmail(email)) {
        alert('Por favor, insira um email válido.');
        return;
      }
    }

    // Validar senha se foi preenchida
    if (newPassword.length > 0) {
      if (newPassword.length < 6) {
        alert('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
      }
      if (!currentPassword) {
        alert('Por favor, informe sua senha atual.');
        return;
      }
    }

    // Atualizar avatar_url no backend (hub_profiles) se houver mudança
    if (isSupabaseAvailable && user && avatarUrl !== profile?.avatar_url) {
      const { error: profileError } = await (
        supabase.from('hub_profiles') as unknown as { update: (v: { avatar_url: string | null }) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }
      ).update({ avatar_url: avatarUrl || null }).eq('id', user.id);
      if (profileError) {
        alert(`Erro ao salvar foto de perfil: ${profileError.message}`);
        return;
      }
      await refreshProfile();
    }

    // Atualizar configurações do usuário
    updateSettings({
      displayName: displayName.trim(),
      language,
      timezone,
      avatarUrl,
    });

    // Atualizar email se foi alterado
    if (user?.email && email !== user.email) {
      const { error: emailError } = await updateEmail(email);
      if (emailError) {
        alert(`Erro ao atualizar email: ${emailError.message}`);
        return;
      }
    }

    // Atualizar senha se foi preenchida
    if (newPassword.length > 0) {
      const { error: passwordError } = await updatePassword(currentPassword, newPassword);
      if (passwordError) {
        alert(`Erro ao atualizar senha: ${passwordError.message}`);
        return;
      }
      // Limpar campos de senha após sucesso
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    onClose();
  };

  const handleCancel = () => {
    // Reverter para valores originais
    setDisplayName(settings.displayName);
    setLanguage(settings.language);
    setTimezone(settings.timezone);
    setAvatarUrl(settings.avatarUrl);
    if (user?.email) {
      setEmail(user.email);
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  // Upload de imagem para Storage e definição da URL pública
  const handleFileSelect = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Use apenas PNG, JPG ou GIF.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setUploadError('A imagem deve ter no máximo 5MB.');
      return;
    }
    if (!user || !isSupabaseAvailable) {
      setUploadError('Não foi possível enviar a foto. Tente fazer login novamente.');
      return;
    }

    setUploadError(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;
    setAvatarUrl(previewUrl);
    setIsUploading(true);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/avatar.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setUploadError(uploadError.message || 'Falha no upload. Tente novamente.');
        return;
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao enviar a imagem.');
    } finally {
      setIsUploading(false);
    }
  }, [user, AVATAR_BUCKET, MAX_AVATAR_BYTES, ALLOWED_TYPES]);

  // Handlers para drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemovePhoto = useCallback(async () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (!user || !isSupabaseAvailable) {
      setAvatarUrl('');
      updateSettings({ avatarUrl: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadError(null);
    const pathsToTry = [`${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.gif`];
    for (const p of pathsToTry) {
      await supabase.storage.from(AVATAR_BUCKET).remove([p]);
    }

    const { error: profileError } = await (
      supabase.from('hub_profiles') as unknown as { update: (v: { avatar_url: null }) => { eq: (c: string, v: string) => Promise<{ error: Error | null }> } }
    ).update({ avatar_url: null }).eq('id', user.id);

    if (!profileError) {
      await refreshProfile();
    }
    setAvatarUrl('');
    updateSettings({ avatarUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [user, updateSettings, refreshProfile]);

  // Gerar iniciais para fallback
  const getInitials = (name: string | undefined | null): string => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Backdrop com glassmorphism */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[15px] transition-opacity duration-200"
        style={{ WebkitBackdropFilter: 'blur(15px)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal com glassmorphism */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        <div className="relative w-full max-w-6xl animate-in fade-in-0 zoom-in-95 duration-200">
          <Card className="bg-card border-border shadow-2xl rounded-3xl overflow-hidden h-[90vh] max-h-[90vh] min-h-[600px] flex flex-col">
            {/* Header com botão voltar */}
            <div className="px-6 py-3 border-b border-border">
              {/* Botão Voltar ao Hub */}
              <div className="mb-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
                  aria-label="Voltar ao Hub"
                >
                  <ArrowBack className="h-5 w-5" />
                  <span>Voltar ao Hub</span>
                </Button>
              </div>

              {/* Título */}
              <h2 id="settings-title" className="text-2xl font-bold text-foreground">
                Configurações
              </h2>
            </div>

            <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-muted/30 p-4 flex-shrink-0 overflow-y-auto">
                  <nav className="space-y-4">
                    {/* Seção Geral */}
                    <div>
                      <div className="px-3 py-2 bg-muted rounded-lg mb-2">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                          Geral
                        </h3>
                      </div>
                      <div className="space-y-1">
                        <button
                          onClick={() => setActiveSection('account')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === 'account'
                            ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02]'
                            }`}
                        >
                          <ManageAccounts className="h-5 w-5" />
                          <span>Conta</span>
                        </button>
                        <button
                          onClick={() => setActiveSection('preferences')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === 'preferences'
                            ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02]'
                            }`}
                        >
                          <SettingsIcon className="h-5 w-5" />
                          <span>Preferências</span>
                        </button>
                      </div>
                    </div>

                    {/* Seção Administrador - Apenas para admins */}
                  </nav>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="relative">
                    {activeSection === 'account' && (
                      <div className="space-y-6 animate-in fade-in-0 duration-200">
                        {/* Foto de Perfil Card */}
                        <Card className="rounded-xl bg-card border-border shadow-md">
                          <CardContent className="p-6 space-y-4">
                            <div>
                              <Label className="text-base font-semibold">Foto de Perfil</Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Adicione uma foto para personalizar seu perfil
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start gap-6">
                              <Avatar className="h-24 w-24 ring-4 ring-white/20">
                                {avatarUrl ? (
                                  <AvatarImage src={avatarUrl} alt="Foto de perfil" />
                                ) : null}
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl font-semibold">
                                  {getInitials(displayName || settings.displayName)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 space-y-3 w-full">
                                <label
                                  htmlFor="avatar-file-input"
                                  className={`block border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${isUploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${isDragging && !isUploading ? 'border-primary bg-primary/10 scale-105' : 'border-white/20 hover:border-primary/50 hover:bg-white/5'}`}
                                  onDragEnter={handleDragEnter}
                                  onDragOver={handleDragOver}
                                  onDragLeave={handleDragLeave}
                                  onDrop={handleDrop}
                                  aria-label="Enviar foto de perfil. Arraste uma imagem ou clique para selecionar."
                                  aria-busy={isUploading}
                                >
                                  <input
                                    ref={fileInputRef}
                                    id="avatar-file-input"
                                    type="file"
                                    accept="image/png,image/jpeg,image/gif"
                                    onChange={handleFileInputChange}
                                    disabled={isUploading}
                                    className="hidden"
                                    aria-label="Selecionar imagem para foto de perfil"
                                  />
                                  <div className="flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
                                    <CloudUpload className="h-8 w-8 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {isUploading ? 'Enviando...' : isDragging ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        PNG, JPG ou GIF até 5MB
                                      </p>
                                    </div>
                                  </div>
                                </label>
                                {uploadError && (
                                  <p className="text-sm text-destructive" role="alert" aria-live="assertive">
                                    {uploadError}
                                  </p>
                                )}

                                {avatarUrl && (
                                  <Button
                                    variant="outline"
                                    onClick={handleRemovePhoto}
                                    className="w-full sm:w-auto"
                                  >
                                    <Delete className="h-4 w-4 mr-2" />
                                    Remover Foto
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Nome de Usuário Card */}
                        <Card className="rounded-xl bg-card border-border shadow-md">
                          <CardContent className="p-6 space-y-3">
                            <Label htmlFor="displayName" className="text-base font-semibold">Nome de Usuário</Label>
                            <Input
                              id="displayName"
                              placeholder="Digite seu nome de usuário"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              maxLength={50}
                              className="bg-background border-border"
                            />
                            <p className="text-sm text-muted-foreground">
                              Este nome será exibido no cabeçalho da aplicação
                            </p>
                          </CardContent>
                        </Card>

                        {/* Email Card */}
                        <Card className="rounded-xl bg-card border-border shadow-md">
                          <CardContent className="p-6 space-y-3">
                            <Label htmlFor="email" className="text-base font-semibold">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Digite seu email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="bg-background border-border"
                            />
                            <p className="text-sm text-muted-foreground">
                              Seu endereço de email para login
                            </p>
                          </CardContent>
                        </Card>

                        {/* Alterar Senha Card */}
                        <Card className="rounded-xl bg-card border-border shadow-md">
                          <CardContent className="p-6 space-y-4">
                            <div>
                              <Label className="text-base font-semibold">Alterar Senha</Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Deixe em branco se não desejar alterar a senha
                              </p>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="currentPassword">Senha Atual</Label>
                                <Input
                                  id="currentPassword"
                                  type="password"
                                  placeholder="Digite sua senha atual"
                                  value={currentPassword}
                                  onChange={(e) => setCurrentPassword(e.target.value)}
                                  className="bg-white/5 border-white/20 mt-2"
                                />
                              </div>

                              <div>
                                <Label htmlFor="newPassword">Nova Senha</Label>
                                <Input
                                  id="newPassword"
                                  type="password"
                                  placeholder="Digite a nova senha"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="bg-white/5 border-white/20 mt-2"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                  Mínimo de 6 caracteres
                                </p>
                              </div>

                              <div>
                                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                <Input
                                  id="confirmPassword"
                                  type="password"
                                  placeholder="Confirme a nova senha"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className="bg-white/5 border-white/20 mt-2"
                                />
                                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                  <p className="text-sm text-destructive mt-1">
                                    As senhas não coincidem
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {activeSection === 'preferences' && (
                      <div className="space-y-6 animate-in fade-in-0 duration-200">
                        {/* Idioma Card */}
                        <Card className="rounded-xl bg-card border-border shadow-md">
                          <CardContent className="p-6 space-y-3">
                            <Label htmlFor="language" className="text-base font-semibold">Idioma</Label>
                            <Select
                              value={language}
                              onValueChange={(value: 'pt-BR' | 'en-US' | 'es-ES') => setLanguage(value)}
                            >
                              <SelectTrigger id="language" className="bg-white/5 border-white/20">
                                <SelectValue placeholder="Selecione um idioma" />
                              </SelectTrigger>
                              <SelectContent>
                                {languages.map((lang) => (
                                  <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </CardContent>
                        </Card>

                        {/* Fuso Horário Card */}
                        <Card className="rounded-xl bg-card border-border shadow-md">
                          <CardContent className="p-6 space-y-3">
                            <Label htmlFor="timezone" className="text-base font-semibold">Fuso Horário</Label>
                            <Select value={timezone} onValueChange={setTimezone}>
                              <SelectTrigger id="timezone" className="bg-white/5 border-white/20">
                                <SelectValue placeholder="Selecione um fuso horário" />
                              </SelectTrigger>
                              <SelectContent>
                                {timezones.map((tz) => (
                                  <SelectItem key={tz.value} value={tz.value}>
                                    {tz.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 p-6 border-t border-border">
              <Button variant="outline" onClick={handleCancel} className="min-h-[44px] min-w-[44px]" disabled={isUploading}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isUploading}
                className={`min-h-[44px] min-w-[44px] ${hasChanges && !isUploading
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-green-200 text-green-800 cursor-not-allowed"
                  }`}
              >
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
