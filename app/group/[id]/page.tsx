import GroupPageClient from './GroupPageClient'

interface GroupPageProps {
  params: {
    id: string
  }
}

export default function GroupPage({ params }: GroupPageProps) {
  return <GroupPageClient groupId={params.id} />
}