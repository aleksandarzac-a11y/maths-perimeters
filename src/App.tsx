import { I18nProvider } from './i18n'
import RotatePrompt from './components/RotatePrompt'
import PerimeterScreen from './screens/PerimeterScreen'

export default function App() {
  return (
    <I18nProvider>
      <RotatePrompt />
      <PerimeterScreen />
    </I18nProvider>
  )
}
