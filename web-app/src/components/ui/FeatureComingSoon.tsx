import React from 'react'
import { Construction } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'

export interface FeatureComingSoonProps {
  title: string
  description?: string
}

export const FeatureComingSoon: React.FC<FeatureComingSoonProps> = ({
  title,
  description = 'Tính năng đang trong giai đoạn phát triển.',
}) => {
  return (
    <Card className="border-dashed border-slate-300 dark:border-slate-700">
      <CardContent className="py-10 px-6 flex flex-col items-center justify-center text-center gap-2">
        <Construction className="w-8 h-8 text-amber-500" />
        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{title}</div>
        <p className="text-xs text-slate-500 max-w-md">{description}</p>
      </CardContent>
    </Card>
  )
}

export default FeatureComingSoon
