import { createContext, useContext, useMemo, useRef, useState } from "react"
import { containers } from "../utils/testLabel"
import use3DModeling from "../hooks/use3DModeling"

const TestLabelContext = createContext(undefined)

export const TestLabelProvider = ({ children }) => {
  const [selected3DObject, setSelected3DObject] = useState(containers[0])
  const { canvasRef, loadTexture } = use3DModeling(selected3DObject)
  const filePickerRef = useRef<HTMLInputElement | undefined>()

  const openPicker = () => {
    filePickerRef.current && filePickerRef.current.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files[0]

    if (!file || !file.type.match("image.*")) return

    const img: any = new Image()
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (evt) => {
      if (evt.target.readyState == FileReader.DONE) {
        img.src = evt.target.result
      }
    }

    img.onload = () => loadTexture(img)
  }

  const value = useMemo(
    () => ({
      handleFileChange,
      openPicker,
      selected3DObject,
      setSelected3DObject,
      filePickerRef,
      canvasRef,
    }),
    [handleFileChange, openPicker, selected3DObject, setSelected3DObject, filePickerRef, canvasRef],
  )

  return <TestLabelContext.Provider value={value}>{children}</TestLabelContext.Provider>
}

export const useTestLabel = () => {
  const context = useContext(TestLabelContext)
  if (context === undefined) {
    throw new Error("useTestLabel must be used within an TestLabelProvider")
  }
  return context
}
