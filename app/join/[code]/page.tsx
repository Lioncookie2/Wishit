import JoinPageClient from './JoinPageClient'

interface JoinPageProps {
  params: {
    code: string
  }
}

export default function JoinPage({ params }: JoinPageProps) {
  return <JoinPageClient code={params.code} />
}