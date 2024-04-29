import { IApiClient } from './api/client';
import './css/global.scss';
import './css/reset.scss';

interface AppProps {
  isSSR: boolean
  children: React.ReactNode
  apiClient: IApiClient
}

function App({ children }: AppProps) {
  return (
    <>
      {children}
    </>
  )
}

export default App