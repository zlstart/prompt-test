export interface InputFrame {
  moveX: -1 | 0 | 1
  aimX: -1 | 0 | 1
  aimY: -1 | 0 | 1
  jumpPressed: boolean
  shootHeld: boolean
  crouch: boolean
}

export interface TouchInputState {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  jump: boolean
  shoot: boolean
}

export const touchInput: TouchInputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  shoot: false,
}

export function setTouchInput(key: keyof TouchInputState, value: boolean) {
  touchInput[key] = value
}

export function clearTouchInput() {
  Object.keys(touchInput).forEach((key) => {
    touchInput[key as keyof TouchInputState] = false
  })
}

export function aimVector(x: number, y: number) {
  if (x === 0 && y === 0) return { x: 0, y: 0 }
  if (Math.abs(x) === Math.abs(y)) {
    return { x: Math.sign(x) * Math.SQRT1_2, y: Math.sign(y) * Math.SQRT1_2 }
  }
  const length = Math.hypot(x, y)
  return { x: x / length, y: y / length }
}
