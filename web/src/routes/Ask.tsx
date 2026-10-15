import {useSearchParams} from 'react-router-dom'
import {ErrorState, PageHead, Spinner} from '@/components/ui'
import {Pooni} from '@/components/Pooni'
import {useUserId} from '@/state/session'
import {useRepairPacksQuery} from '@/state/queries/repair'

/** Pooni on its own page. With ?file=, Pooni answers from that one file only. */
export function AskPage() {
  const userId = useUserId()
  const [params] = useSearchParams()
  const fileId = params.get('file')
  const {data: packs, isLoading, error, refetch} = useRepairPacksQuery(userId)
  const files = fileId ? (packs ?? []).filter(f => f.id === fileId) : (packs ?? [])
  const scoped = fileId ? files[0] : undefined

  return (
    <div className="container page">
      <PageHead
        back={scoped ? {to: `/files/${scoped.id}`, label: scoped.problem} : {to: '/files', label: 'Your repairs'}}
        title={scoped ? 'Ask Pooni about this file' : 'Ask Pooni'}
        description="Pooni answers only from your repair files and the notes on your documents."
      />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Pooni userId={userId} files={files} fileId={scoped?.id ?? null} scopeLabel={scoped?.problem} />
      )}
    </div>
  )
}
