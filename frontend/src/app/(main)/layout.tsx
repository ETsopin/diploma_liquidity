import { ReactNode } from 'react'
import Wrapper from '@/components/Layout/Wrapper';


export default function MainLayout({ children }: { children: ReactNode }) {
  return <Wrapper>{children}</Wrapper>;
}
