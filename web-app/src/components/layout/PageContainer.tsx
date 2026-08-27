import React from 'react'
import type { ContainerVariant } from '../../types/design-system'

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ContainerVariant
  as?: 'main' | 'div' | 'section' | 'article'
  children: React.ReactNode
  className?: string
}

const variantClassMap: Record<ContainerVariant, string> = {
  narrow: 'page-container-narrow', // max-w-3xl (768px): Profile, Settings
  default: 'page-container-default', // max-w-7xl (1280px): Detailed Views, Forms
  wide: 'page-container-wide', // max-w-[1600px] (1600px): Dashboard, Analytics
  full: 'page-container-full', // 100%: Large Data Tables (Contacts, Logs)
}

export const PageContainer: React.FC<PageContainerProps> = ({
  variant = 'default',
  as: Component = 'div',
  children,
  className = '',
  ...props
}) => {
  return (
    <Component
      className={`page-container ${variantClassMap[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

export default PageContainer
