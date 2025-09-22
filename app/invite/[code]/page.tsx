import InvitePageClient from './InvitePageClient'

interface InvitePageProps {
  params: {
    code: string
  }
}

export default function InvitePage({ params }: InvitePageProps) {
  return <InvitePageClient code={params.code} />
}