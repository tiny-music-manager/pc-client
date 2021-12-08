import path from 'path'
import fs from 'fs'
import os from 'os'

export const dirs = {
	// 配置目录
	get configdir() {
		return path.join(os.homedir(), '.config/tmm')
	},
	// home目录
	get homedir() {
		return os.homedir()
	}
}