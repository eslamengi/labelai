import {
  useRedrawOnChangeFile,
  useRedrawOnResize,
  useSelectBox,
} from '../../context/useRedraw'
import useKeyDownControls from '../../context/useKeyDownControls'
import useZoom from '../../context/useZoom'
import { useDashboard } from '../../context'

let startX
let startY
let isDown
let newBox
let movingBox
let resizing

export default function Center() {
  const { state, boxes, canvasRef, dispatch } = useDashboard()
  const onZoom = useZoom()
  const file = state.files[state.fileIndex]
  const selectBox = useSelectBox()

  useRedrawOnChangeFile()
  useRedrawOnResize()
  useKeyDownControls()

  function onMouseWheel(e) {
    e.preventDefault()
    onZoom(e.wheelDelta ? e.wheelDelta / 40 : e.detail ? -e.detail : 0)
    return false
  }

  function onMouseDown(e) {
    const { left, top } = canvasRef.current.getBoundingClientRect()
    const { selected, oppositeCorner } = selectBox(e, true)
    const [x, y] = oppositeCorner || []

    startX = x || parseInt(e.clientX - left, 10)
    startY = y || parseInt(e.clientY - top, 10)
    isDown = true
    newBox = !oppositeCorner
    movingBox = oppositeCorner ? undefined : selected
    resizing = oppositeCorner ? selected : undefined
  }

  function onMouseMove(e) {
    e.preventDefault()
    e.stopPropagation()

    if (!isDown) {
      const { selected, oppositeCorner } = selectBox(e)

      if (oppositeCorner) {
        const [w, h] = oppositeCorner
        const [w1, h1, w2, h2] = boxes[selected]
        const left = Math.max(w, w1, w2) === w
        const top = Math.max(h, h1, h2) === h
        const nesw = (top && !left) || (!top && left)
        canvasRef.current.style = `cursor: ${
          nesw ? 'nesw-resize' : 'nwse-resize'
        };`
      } else if (selected > -1) {
        canvasRef.current.style = 'cursor: move;'
      } else {
        canvasRef.current.style = 'cursor: crosshair;'
      }
      return
    }

    const { left, top } = canvasRef.current.getBoundingClientRect()
    const mouseX = parseInt(e.clientX - left, 10)
    const mouseY = parseInt(e.clientY - top, 10)
    const data = [startX, startY, mouseX, mouseY]

    if (startX === mouseX || mouseY === startY) return

    if (movingBox > -1) {
      startX = mouseX
      startY = mouseY
      dispatch({ type: 'move-box', data })
    } else if (newBox) dispatch({ type: 'add-box', data })
    else if (resizing > -1)
      dispatch({ type: 'edit-box', data: { box: data, index: resizing } })
    else
      dispatch({
        type: 'edit-box',
        data: { box: data, index: boxes.length - 1 },
      })
    newBox = false
  }

  function stopDragging(e) {
    e.preventDefault()
    e.stopPropagation()

    isDown = false
    movingBox = undefined
    resizing = undefined
  }

  if (!file) return null

  return (
    <canvas
      width={state.size.width}
      height={state.size.height}
      ref={canvasRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseOut={stopDragging}
      onMouseUp={stopDragging}
      onMouseWheel={onMouseWheel}
    />
  )
}
