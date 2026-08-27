import { audioEngine } from '../game/systems/audio'
import { gameEvents } from '../game/events'
import type { GameSnapshot } from '../game/state'

interface OverlayProps {
  snapshot: GameSnapshot
  muted: boolean
  onToggleMute: () => void
}

export function Overlay({ snapshot, muted, onToggleMute }: OverlayProps) {
  if (snapshot.status === 'playing') return null

  const activateAndSend = (command: 'start' | 'resume' | 'restart' | 'title') => {
    void audioEngine.activate()
    gameEvents.emitCommand(command)
  }

  if (snapshot.status === 'title' || snapshot.status === 'loading') {
    return (
      <div className="overlay overlay--title">
        <div className="title-lockup">
          <span className="title-lockup__signal">OPERATION // N-13</span>
          <h1><span>霓虹丛林</span><b>雷霆行动</b></h1>
          <p>深入失控的雨林军工区，切断机械军团的核心。</p>
          <button className="primary-button" onClick={() => activateAndSend('start')}>开始任务</button>
          <div className="control-brief" aria-label="键盘操作说明">
            <span><kbd>WASD</kbd> 移动 / 瞄准</span>
            <span><kbd>J</kbd> 射击</span>
            <span><kbd>K</kbd> 跳跃</span>
          </div>
        </div>
        <button className="sound-toggle" onClick={onToggleMute} aria-label={muted ? '打开声音' : '关闭声音'}>
          {muted ? 'SOUND OFF' : 'SOUND ON'}
        </button>
      </div>
    )
  }

  if (snapshot.status === 'paused') {
    return (
      <div className="overlay overlay--panel">
        <div className="mission-panel">
          <span className="panel-code">TACTICAL LINK SUSPENDED</span>
          <h2>任务暂停</h2>
          <button className="primary-button" onClick={() => activateAndSend('resume')}>继续任务</button>
          <button className="secondary-button" onClick={() => activateAndSend('restart')}>重新开始</button>
        </div>
      </div>
    )
  }

  const victory = snapshot.status === 'victory'
  return (
    <div className={`overlay overlay--panel ${victory ? 'overlay--victory' : 'overlay--defeat'}`}>
      <div className="mission-panel mission-panel--result">
        <span className="panel-code">{victory ? 'CORE NEUTRALIZED' : 'SIGNAL LOST'}</span>
        <h2>{victory ? '任务完成' : '任务失败'}</h2>
        <div className="result-grid">
          <span>最终得分 <b>{snapshot.score.toString().padStart(6, '0')}</b></span>
          <span>最高连击 <b>× {Math.max(1, snapshot.combo)}</b></span>
          <span>行动时间 <b>{Math.floor(snapshot.elapsedMs / 60000)}:{Math.floor((snapshot.elapsedMs % 60000) / 1000).toString().padStart(2, '0')}</b></span>
        </div>
        <button className="primary-button" onClick={() => activateAndSend('restart')}>再次挑战</button>
        <button className="secondary-button" onClick={() => activateAndSend('title')}>返回标题</button>
      </div>
    </div>
  )
}
