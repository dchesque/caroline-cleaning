'use client'

import { useState } from 'react'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw, Search, Filter, Users, Clock, Phone, CheckCircle2, UserPlus } from 'lucide-react'
import { useLeads } from '@/lib/hooks/use-leads'
import { useLeadStats } from '@/lib/hooks/use-lead-stats'
import { filterLeads } from '@/lib/utils/leads-normalizer'
import type { UnifiedLead, UnifiedLeadStatus } from '@/types/leads'
import type { LeadFilters } from '@/types/leads'
import { LeadsTable } from '@/components/leads/leads-table'
import { LeadsMobileList } from '@/components/leads/leads-mobile-list'
import { LeadDetailModal } from '@/components/leads/lead-detail-modal'
import { ConvertToClientModal } from '@/components/leads/convert-to-client-modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function LeadsPage() {
  const { t } = useAdminI18n()
  const leadsT = t('leads')
  const common = t('common')

  const [filters, setFilters] = useState<LeadFilters>({
    search: '',
    source: 'all',
    status: 'all'
  })

  const [selectedLead, setSelectedLead] = useState<UnifiedLead | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isConvertOpen, setIsConvertOpen] = useState(false)

  const { leads, isLoading, error, refetch } = useLeads(filters)
  const { stats } = useLeadStats()

  const filteredLeads = filterLeads(leads, filters)

  const handleViewDetails = (lead: UnifiedLead) => {
    setSelectedLead(lead)
    setIsDetailOpen(true)
  }

  const handleConvert = (lead: UnifiedLead) => {
    setSelectedLead(lead)
    setIsConvertOpen(true)
  }

  const handleLeadUpdated = () => {
    refetch()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {leadsT.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {leadsT.subtitle}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          {common.update}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">{leadsT.stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.hoje}</p>
                  <p className="text-xs text-muted-foreground">{leadsT.stats.today}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.novos}</p>
                  <p className="text-xs text-muted-foreground">{leadsT.stats.new}</p>
                </div>
                <UserPlus className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.contatados}</p>
                  <p className="text-xs text-muted-foreground">{leadsT.stats.contacted}</p>
                </div>
                <Phone className="w-8 h-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.convertidos}</p>
                  <p className="text-xs text-muted-foreground">{leadsT.stats.converted}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={leadsT.filters.search}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9 bg-white"
          />
        </div>
        <Select
          value={filters.source}
          onValueChange={(value) => setFilters({ ...filters, source: value as 'all' | 'chat' | 'form' })}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder={leadsT.filters.sourcePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{leadsT.source.all}</SelectItem>
            <SelectItem value="chat">{leadsT.source.chat}</SelectItem>
            <SelectItem value="form">{leadsT.source.form}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value as 'all' | UnifiedLeadStatus })}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder={leadsT.filters.statusPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{common.all}</SelectItem>
            <SelectItem value="novo">{leadsT.status.novo}</SelectItem>
            <SelectItem value="novo_incompleto">{leadsT.status.novo_incompleto}</SelectItem>
            <SelectItem value="contatado">{leadsT.status.contatado}</SelectItem>
            <SelectItem value="retorno_futuro">{leadsT.status.retorno_futuro}</SelectItem>
            <SelectItem value="convertido">{leadsT.status.convertido}</SelectItem>
            <SelectItem value="descartado">{leadsT.status.descartado}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Display */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <LeadsTable leads={filteredLeads} onViewDetails={handleViewDetails} />
              <LeadsMobileList leads={filteredLeads} onViewDetails={handleViewDetails} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <LeadDetailModal
        lead={selectedLead}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onLeadUpdated={handleLeadUpdated}
        onConvert={handleConvert}
      />

      <ConvertToClientModal
        lead={selectedLead}
        open={isConvertOpen}
        onOpenChange={setIsConvertOpen}
        onConverted={handleLeadUpdated}
      />
    </div>
  )
}
