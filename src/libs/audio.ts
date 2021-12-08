export class TMMAudio extends Audio {
	/** 是否正在播放 */
	public get playing() {
		return !(this.paused || this.ended)
	}

	/** 播放百分比 */
	public get percent() {
		if (!this.duration || isNaN(this.duration)) return 0
		return this.currentTime * 100 / this.duration
	}

	/** 自动播放/暂停 */
	public playPause() {
		this.playing ? this.pause() : this.play()
	}
}