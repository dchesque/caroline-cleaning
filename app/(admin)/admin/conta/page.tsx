'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    ArrowLeft,
    User,
    Shield,
    Settings,
    Loader2,
    Save,
    Eye,
    EyeOff,
    Globe,
    Bell,
    Mail,
    MessageSquare,
    Check,
    Camera,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { formatPhoneUS } from '@/lib/formatters'
import { validatePassword } from '@/lib/security/password'
import { Locale } from '@/lib/admin-i18n/translations'
import { UserProfile } from '@/types'
import { cn } from '@/lib/utils'

export default function ContaPage() {
    const { t, locale, setLocale } = useAdminI18n()
    const supabase = createClient()

    const accountT = t('account')
    const commonT = t('common')
    const dateLocale = locale === 'pt-BR' ? ptBR : enUS

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Password form state
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
    const [changingPassword, setChangingPassword] = useState(false)

    const adminInputStyles = "bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"

    useEffect(() => { fetchProfile() }, [])

    async function fetchProfile() {
        try {
            setLoading(true)
            const response = await fetch('/api/profile')
            if (!response.ok) throw new Error('Failed to fetch profile')
            const data = await response.json()
            setProfile(data)
        } catch (error) {
            console.error(error)
            toast.error(accountT.profile.error)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdateProfile() {
        if (!profile) return
        try {
            setSaving(true)
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            })
            if (!response.ok) throw new Error('Failed to update profile')
            toast.success(accountT.profile.success)
        } catch (error) {
            console.error(error)
            toast.error(accountT.profile.error)
        } finally {
            setSaving(false)
        }
    }

    async function handleAvatarUpload(file: File) {
        if (!profile) return
        const MAX_MB = 2
        if (file.size > MAX_MB * 1024 * 1024) {
            toast.error(`Imagem muito grande. Máximo ${MAX_MB}MB.`)
            return
        }
        try {
            setUploadingAvatar(true)
            const ext = file.name.split('.').pop()
            const path = `avatars/${profile.id}/${Date.now()}.${ext}`
            const { error: uploadError } = await supabase.storage
                .from('public-assets')
                .upload(path, file, { upsert: true, contentType: file.type })
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('public-assets')
                .getPublicUrl(path)

            const updated = { ...profile, avatar_url: publicUrl }
            setProfile(updated)

            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            })
            if (!response.ok) throw new Error('Failed to save avatar')
            toast.success('Foto atualizada com sucesso.')
        } catch (error) {
            console.error(error)
            toast.error('Erro ao fazer upload da foto.')
        } finally {
            setUploadingAvatar(false)
        }
    }

    async function handleChangePassword() {
        if (passwords.new !== passwords.confirm) {
            toast.error(accountT.security.passwordMismatch)
            return
        }

        const validation = validatePassword(passwords.new)
        if (!validation.valid) {
            toast.error(validation.error)
            return
        }

        try {
            setChangingPassword(true)
            const response = await fetch('/api/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new,
                }),
            })
            const data = await response.json()
            if (!response.ok) {
                toast.error(data.error || accountT.security.passwordError)
                return
            }
            toast.success(accountT.security.passwordSuccess)
            setPasswords({ current: '', new: '', confirm: '' })
        } catch (error) {
            console.error(error)
            toast.error(accountT.security.passwordError)
        } finally {
            setChangingPassword(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-[#C48B7F]" />
            </div>
        )
    }

    if (!profile) return null

    return (
        <div className="space-y-6 pb-12 overflow-x-hidden">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Link href="/admin" className="hover:text-brandy-rose-500 flex items-center gap-1 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        {commonT.dashboard}
                    </Link>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{accountT.title}</h1>
                <p className="text-muted-foreground">{accountT.subtitle}</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-[#FDF8F6] border border-[#EAE0D5] p-1">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-brandy-rose-600 data-[state=active]:shadow-sm">
                        <User className="h-4 w-4 mr-2" />
                        {accountT.tabs.profile}
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:text-brandy-rose-600 data-[state=active]:shadow-sm">
                        <Shield className="h-4 w-4 mr-2" />
                        {accountT.tabs.security}
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="data-[state=active]:bg-white data-[state=active]:text-brandy-rose-600 data-[state=active]:shadow-sm">
                        <Settings className="h-4 w-4 mr-2" />
                        {accountT.tabs.preferences}
                    </TabsTrigger>
                </TabsList>

                {/* ABA PERFIL */}
                <TabsContent value="profile" className="space-y-6">
                    <Card className="border-[#EAE0D5] shadow-sm bg-white overflow-hidden">
                        <CardHeader className="border-b border-[#F7F2ED] bg-[#FDF8F6]/50">
                            <CardTitle className="text-xl text-gray-800">{accountT.profile.title}</CardTitle>
                            <CardDescription>{accountT.profile.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Avatar + upload */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                                            <AvatarImage src={profile.avatar_url || ''} />
                                            <AvatarFallback className="bg-brandy-rose-100 text-brandy-rose-600 text-2xl font-bold">
                                                {profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {uploadingAvatar && (
                                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleAvatarUpload(file)
                                            e.target.value = ''
                                        }}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        disabled={uploadingAvatar}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera className="h-4 w-4 mr-2" />
                                        {accountT.profile.changePhoto}
                                    </Button>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">{accountT.profile.fullName}</Label>
                                        <Input
                                            id="full_name"
                                            value={profile.full_name || ''}
                                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                            placeholder={accountT.profile.fullNamePlaceholder}
                                            className={adminInputStyles}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{accountT.profile.email}</Label>
                                        <Input
                                            id="email"
                                            value={profile.email || ''}
                                            readOnly
                                            disabled
                                            className={cn(adminInputStyles, "bg-gray-50 cursor-not-allowed opacity-70")}
                                        />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                            {accountT.profile.emailDescription}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">{accountT.profile.phone}</Label>
                                        <Input
                                            id="phone"
                                            value={profile.phone || ''}
                                            onChange={(e) => setProfile({ ...profile, phone: formatPhoneUS(e.target.value) })}
                                            placeholder={accountT.profile.phonePlaceholder}
                                            className={adminInputStyles}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{accountT.profile.role}</Label>
                                        <div className="flex items-center pt-2">
                                            <Badge className="bg-brandy-rose-500 hover:bg-brandy-rose-600 px-3 py-1">
                                                {accountT.profile.roles[profile.role]}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-[#F7F2ED]" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Globe className="h-4 w-4" />
                                    <span>{accountT.profile.memberSince}: <strong>{profile.created_at ? format(new Date(profile.created_at), 'PP', { locale: dateLocale }) : '-'}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Check className="h-4 w-4" />
                                    <span>{accountT.profile.lastLogin}: <strong>{profile.last_login_at ? formatDistanceToNow(new Date(profile.last_login_at), { addSuffix: true, locale: dateLocale }) : '-'}</strong></span>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleUpdateProfile}
                                    disabled={saving}
                                    className="bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white min-w-[150px]"
                                >
                                    {saving ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{accountT.profile.saving}</>
                                    ) : (
                                        <><Save className="mr-2 h-4 w-4" />{accountT.profile.saveChanges}</>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ABA SEGURANÇA */}
                <TabsContent value="security" className="space-y-6">
                    <Card className="border-[#EAE0D5] shadow-sm bg-white overflow-hidden">
                        <CardHeader className="border-b border-[#F7F2ED] bg-[#FDF8F6]/50">
                            <CardTitle className="text-xl text-gray-800">{accountT.security.changePassword}</CardTitle>
                            <CardDescription>{accountT.security.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="max-w-md space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">{accountT.security.currentPassword}</Label>
                                    <div className="relative">
                                        <Input
                                            id="current-password"
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwords.current}
                                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                            placeholder={accountT.security.currentPasswordPlaceholder}
                                            className={adminInputStyles}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-password">{accountT.security.newPassword}</Label>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                            placeholder={accountT.security.newPasswordPlaceholder}
                                            className={adminInputStyles}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                        Mínimo 12 caracteres · maiúscula · minúscula · número · caractere especial
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">{accountT.security.confirmPassword}</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password"
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                            placeholder={accountT.security.confirmPasswordPlaceholder}
                                            className={adminInputStyles}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleChangePassword}
                                    disabled={changingPassword || !passwords.current || !passwords.new || !passwords.confirm}
                                    className="bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white min-w-[150px]"
                                >
                                    {changingPassword ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{accountT.security.updating}</>
                                    ) : accountT.security.updatePassword}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ABA PREFERÊNCIAS */}
                <TabsContent value="preferences" className="space-y-6">
                    <Card className="border-[#EAE0D5] shadow-sm bg-white overflow-hidden">
                        <CardHeader className="border-b border-[#F7F2ED] bg-[#FDF8F6]/50">
                            <CardTitle className="text-xl text-gray-800">{accountT.preferences.title}</CardTitle>
                            <CardDescription>{accountT.preferences.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-brandy-rose-500" />
                                        <Label className="text-base font-semibold">{accountT.preferences.language}</Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{accountT.preferences.languageDescription}</p>
                                    <Select
                                        value={profile.language}
                                        onValueChange={(v) => {
                            setProfile({ ...profile, language: v })
                            setLocale(v as Locale)
                        }}
                                    >
                                        <SelectTrigger className={adminInputStyles}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                            <SelectItem value="en-US">English (USA)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-brandy-rose-500" />
                                        <Label className="text-base font-semibold">{accountT.preferences.theme}</Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{accountT.preferences.themeDescription}</p>
                                    <Select
                                        value={profile.theme}
                                        onValueChange={(v: any) => setProfile({ ...profile, theme: v })}
                                    >
                                        <SelectTrigger className={adminInputStyles}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">{accountT.preferences.themes.light}</SelectItem>
                                            <SelectItem value="dark">{accountT.preferences.themes.dark}</SelectItem>
                                            <SelectItem value="system">{accountT.preferences.themes.system}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator className="bg-[#F7F2ED]" />

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-brandy-rose-500" />
                                    <Label className="text-base font-semibold">{accountT.preferences.notifications}</Label>
                                </div>
                                <p className="text-sm text-muted-foreground">{accountT.preferences.notificationsDescription}</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="flex items-center justify-between p-4 rounded-lg border border-[#F7F2ED] bg-[#FDF8F6]/10">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                            <span className="text-sm font-medium">{accountT.preferences.emailNotifications}</span>
                                        </div>
                                        <Switch
                                            checked={profile.email_notifications}
                                            onCheckedChange={(v) => setProfile({ ...profile, email_notifications: v })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-lg border border-[#F7F2ED] bg-[#FDF8F6]/10">
                                        <div className="flex items-center gap-3">
                                            <Bell className="h-5 w-5 text-gray-400" />
                                            <span className="text-sm font-medium">{accountT.preferences.pushNotifications}</span>
                                        </div>
                                        <Switch
                                            checked={profile.push_notifications}
                                            onCheckedChange={(v) => setProfile({ ...profile, push_notifications: v })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-lg border border-[#F7F2ED] bg-[#FDF8F6]/10">
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="h-5 w-5 text-gray-400" />
                                            <span className="text-sm font-medium">{accountT.preferences.smsNotifications}</span>
                                        </div>
                                        <Switch
                                            checked={profile.sms_notifications}
                                            onCheckedChange={(v) => setProfile({ ...profile, sms_notifications: v })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    {accountT.preferences.notificationTypes.title}
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                    {Object.entries(profile.notification_types).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">
                                                {(accountT.preferences.notificationTypes as any)[key]}
                                            </span>
                                            <Switch
                                                checked={value}
                                                onCheckedChange={(v) => setProfile({
                                                    ...profile,
                                                    notification_types: { ...profile.notification_types, [key]: v },
                                                })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleUpdateProfile}
                                    disabled={saving}
                                    className="bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white min-w-[200px]"
                                >
                                    {saving ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{accountT.profile.saving}</>
                                    ) : (
                                        <><Save className="mr-2 h-4 w-4" />{accountT.preferences.savePreferences}</>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
