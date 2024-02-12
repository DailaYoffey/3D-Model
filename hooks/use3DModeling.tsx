import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { PointLight } from "three/src/lights/PointLight"
import { TextureLoader } from "three/src/loaders/TextureLoader"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import { AmbientLight } from "three/src/lights/AmbientLight"
import { Scene } from "three/src/scenes/Scene"
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera"
import gsap from "gsap"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

let prevObject

const use3DModeling = (selected3DObject) => {
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef(null)
  const [materialSrc, setMaterialSrc] = useState(null)

  const renderer = useMemo(() => {
    if (!canvasRef.current) return null
    const webGLRenderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    })
    webGLRenderer.setSize(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight)

    return webGLRenderer
  }, [canvasRef?.current])

  const scene = useMemo(() => new Scene(), [])

  const camera = useMemo(() => {
    if (!canvasRef.current) return null
    return new PerspectiveCamera(
      75,
      canvasRef.current.offsetWidth / canvasRef.current.offsetHeight,
      0.1,
      1000,
    )
  }, [canvasRef?.current])

  const anchor = useMemo(() => {
    const group = new THREE.Group()
    group.position.set(0, 0, 0)

    return group
  }, [])

  const ambientLight = useMemo(() => new AmbientLight(0xffffff, 1), [])

  const controls = useMemo(() => {
    if (!camera || !renderer) return null
    return new OrbitControls(camera, renderer.domElement)
  }, [camera, renderer])

  const addStages = useCallback(() => {
    if (!scene || !camera || !anchor) return
    scene.add(camera)
    scene.add(anchor)
  }, [scene, camera, anchor])

  const addLightings = useCallback(() => {
    if (!scene || !camera || !ambientLight) return
    const lights = []
    scene.add(ambientLight)

    lights[0] = new PointLight(0xffffff, 1, 0)
    lights[1] = new PointLight(0xffffff, 1, 0)

    lights[0].position.set(-100, -100, -100)
    lights[1].position.set(100, 100, 100)

    camera.add(lights[0])
    camera.add(lights[1])
  }, [camera, scene, ambientLight])

  const addControls = useCallback(() => {
    if (!controls) return
    controls.enableDamping = true
    controls.dampingFactor = 0.25
    controls.enableZoom = false
  }, [controls])

  const resetCamera = useCallback(() => {
    if (!camera) return
    camera.position.set(0, 30, -50)
    camera.updateProjectionMatrix()
  }, [camera])

  const loadObject = useCallback(() => {
    if (!selected3DObject) return

    const src = selected3DObject.material
    const { obj } = selected3DObject

    if (loading) return

    const loader = new OBJLoader()
    const textureLoader = new TextureLoader()

    setMaterialSrc(src)
    setLoading(false)

    loader.load(
      obj,
      (object) => {
        object.traverse((_obj) => {
          if (_obj instanceof THREE.Mesh)
            _obj.material = new THREE.MeshPhongMaterial({
              map: textureLoader.load(src),
              shininess: 10,
            })
        })

        const box = new THREE.Box3().setFromObject(object)
        const center = new THREE.Vector3()
        box.getCenter(center)
        object.position.sub(center)

        gsap.to(anchor.scale, {
          x: 0,
          y: 0,
          z: 0,
          ease: "power4.out",
          duration: 0.5,
        })

        gsap.to(anchor.rotation, {
          y: Math.PI * 2,
          z: Math.PI * 2,
          ease: "power4.out",
          duration: 1,
          onComplete: () => {
            anchor.remove(prevObject)
            anchor.add(object)
            prevObject = object

            resetCamera()

            gsap.to(anchor.scale, {
              x: 1,
              y: 1,
              z: 1,
              ease: "power4.out",
              duration: 0.8,
            })

            gsap.to(anchor.rotation, {
              y: 0,
              z: 0,
              ease: "power4.out",
              duration: 2,
              onComplete: () => {
                setLoading(false)
              },
            })
          },
        })
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded")
      },
      (error) => {
        console.log("An error happened", error)
      },
    )
  }, [selected3DObject, resetCamera, anchor])

  const animate = useCallback(() => {
    if (!renderer || !controls || !scene || !camera) return

    camera.lookAt(anchor.position)
    controls.update()
    renderer.render(scene, camera)

    requestAnimationFrame(animate)
  }, [renderer, controls, scene, camera])

  const loadTexture = (newImage) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const baseImage: HTMLImageElement = new Image()

    baseImage.src = selected3DObject.material
    newImage.crossOrigin = "anonymous"
    baseImage.crossOrigin = "anonymous"
    baseImage.id = "okay"

    baseImage.onload = () => {
      canvas.width = baseImage.naturalWidth
      canvas.height = baseImage.naturalHeight

      ctx.drawImage(baseImage, 0, 0, baseImage.naturalWidth, baseImage.naturalHeight)

      const x = parseInt(selected3DObject.logo.x)
      const y = parseInt(selected3DObject.logo.y)
      const w = parseInt(selected3DObject.logo.width)
      const h = parseInt(selected3DObject.logo.height)

      const ratio = w / newImage.naturalWidth

      const resizedWidth = newImage.naturalWidth > w ? w : newImage.naturalWidth

      const resizedHeight =
        newImage.naturalHeight > h
          ? Math.min(newImage.naturalHeight * ratio, h)
          : newImage.naturalHeight

      const xOffset = (w - resizedWidth) / 2,
        yOffset = (h - resizedHeight) / 2

      ctx.fillStyle = "#fff"
      ctx.fillRect(x, y, w, h)

      ctx.drawImage(
        newImage,
        x + (xOffset > 0 ? xOffset : 0),
        y + (yOffset > 0 ? yOffset : 0),
        resizedWidth,
        resizedHeight,
      )

      const mergedMap = canvas.toDataURL()

      const img = document.createElement("img")
      img.src = mergedMap

      const textureLoader = new TextureLoader()

      textureLoader.load(mergedMap, (texture) => {
        prevObject.traverse((child) => {
          if (child.isMesh) {
            child.material.map = texture
            texture.needsUpdate = true
            child.material.needsUpdate = true
          }
        })
      })
    }
  }

  const initializeAnimation = useCallback(() => {
    addStages()
    addLightings()
    addControls()
    resetCamera()
    loadObject()
    animate()
  }, [addStages, addLightings, addControls, resetCamera, loadObject, animate])

  useEffect(() => {
    initializeAnimation()
  }, [initializeAnimation])

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef?.current && camera && renderer) {
        canvasRef.current.style = ""
        camera.aspect = canvasRef.current.offsetWidth / canvasRef.current.offsetHeight
        camera.updateProjectionMatrix()
        renderer.setSize(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight)
      }
    }

    if (!canvasRef.current || !camera || !renderer) return
    window.addEventListener("resize", handleResize, false)

    return () => {
      window.removeEventListener("resize", handleResize, false)
    }
  }, [canvasRef?.current, camera, renderer])

  return {
    canvasRef,
    loadTexture,
  }
}

export default use3DModeling
