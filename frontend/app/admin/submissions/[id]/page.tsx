
import SubmissionDetailClient from './SubmissionDetailClient'

export default async function SubmissionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return <SubmissionDetailClient id={params.id} />
}