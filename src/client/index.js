import 'ses'
// LiveKit defines an own Promise.resolve field by assignment during import.
// Initialize it before SES freezes the inherited field; app scripts still run
// only after lockdown has completed.
import 'livekit-client'
import '../core/lockdown'
import { createRoot } from 'react-dom/client'

import { Client } from './world-client'

function App() {
  return <Client wsUrl={env.PUBLIC_WS_URL} />
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)
