import { useRef, useEffect, useCallback, useState } from 'react'
import { useDashboard } from '../../context'

const isNode = typeof window === 'undefined'
const svg = isNode
  ? undefined
  : document.createElementNS('http://www.w3.org/2000/svg', 'svg')
const xform = isNode ? undefined : svg.createSVGMatrix()
const svgPoint = isNode ? undefined : svg.createSVGPoint()

let startX
let startY
let isDown

function transformedPoint(x, y) {
  svgPoint.x = x
  svgPoint.y = y
  return svgPoint.matrixTransform(xform.inverse())
}

export default function Center() {
  const [size, setSize] = useState({})
  const ref = useRef()
  const imgRef = useRef()
  const ctxRef = useRef()
  const { state } = useDashboard()
  const file = state.files[state.fileIndex]

  function redraw() {
    const img = imgRef.current
    const canvas = ref.current
    const ctx = ctxRef.current
    const ratio = img.width / img.height
    let width = canvas.width
    let height = width / ratio

    if (height > canvas.height) {
      height = canvas.height
      width = height * ratio
    }

    // Clear canvas
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    // Draw
    ctx.drawImage(img, 0, 0, width, height)
    URL.revokeObjectURL(img.src)
  }

  useEffect(() => {
    if (!imgRef.current) return
    redraw()
  }, [size.width])

  useEffect(() => {
    if (!file) return

    const handler = () => {
      setSize({
        width: window.innerWidth - 420,
        height: window.innerHeight,
      })
      redraw()
    }

    const context = ref.current.getContext('2d')
    const img = new Image()

    img.src = URL.createObjectURL(file)
    img.onload = handler
    imgRef.current = img
    ctxRef.current = context

    window.addEventListener('resize', handler)

    return () => window.removeEventListener('resize', handler)
  }, [file])

  function onZoom(e) {
    const delta = e.wheelDelta ? e.wheelDelta / 40 : e.detail ? -e.detail : 0
    if (delta) {
      const canvas = ref.current
      const ctx = canvas.getContext('2d')
      const pt = transformedPoint(canvas.width / 2, canvas.height / 2)
      ctx.translate(pt.x, pt.y)
      const factor = Math.pow(1.1, delta)
      ctx.scale(factor, factor)
      ctx.translate(-pt.x, -pt.y)
      redraw()
    }
    return e.preventDefault() && false
  }

  function onMouseDown(e) {
    const { left, top } = ref.current.getBoundingClientRect()

    startX = parseInt(e.clientX - left, 10)
    startY = parseInt(e.clientY - top, 10)
    isDown = true
  }

  function arc(ctx, x, y) {
    ctx.beginPath()
    ctx.fillStyle = '#aed581'
    ctx.arc(x, y, 5, 0, 2 * Math.PI)
    ctx.closePath()
    ctx.fill()
  }

  function onMouseMove(e) {
    e.preventDefault()
    e.stopPropagation()

    if (!isDown) return

    const { left, top } = ref.current.getBoundingClientRect()
    const ctx = ctxRef.current
    const mouseX = parseInt(e.clientX - left)
    const mouseY = parseInt(e.clientY - top)

    ctx.beginPath()
    ctx.clearRect(0, 0, ref.current.width, ref.current.height)
    redraw()
    ctx.fillStyle = '#aed58144'
    ctx.lineWidth = 2
    ctx.fillRect(startX, startY, mouseX - startX, mouseY - startY)
    arc(ctx, startX, startY)
    arc(ctx, startX + (mouseX - startX), startY)
    arc(ctx, startX, startY + (mouseY - startY))
    arc(ctx, mouseX, mouseY)
  }

  function stopDragging(e) {
    e.preventDefault()
    e.stopPropagation()

    isDown = false
  }

  if (!file) return null

  return (
    <canvas
      width={size.width}
      height={size.height}
      onMouseWheel={onZoom}
      onMouseDown={onMouseDown}
      onMouseOut={stopDragging}
      onMouseUp={stopDragging}
      onMouseMove={onMouseMove}
      ref={ref}
    />
  )
}