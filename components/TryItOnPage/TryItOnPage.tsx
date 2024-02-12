import useScrollTryItOn from "../../hooks/useScrollTryItOn"
import { TestLabelProvider } from "../../providers/TestLabelProvider"
import TestLabelSection from "./TestLabelSection"

const TryItOnPage = () => {
  const { testRef } = useScrollTryItOn()

  return (
    <div ref={testRef}>
      <TestLabelProvider>
        <TestLabelSection />
      </TestLabelProvider>
    </div>
  )
}

export default TryItOnPage
