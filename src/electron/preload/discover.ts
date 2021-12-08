import os from 'os'
import dgram from 'dgram'
import electron from 'electron'
import { commonApi } from './lib'

const SERVER_UDP_PORT = 38011

//尝试从局域网得到地址
function getAddress() {
	const data = JSON.stringify({ type: 'getaddress' })

	return new Promise<string | null>(async resolve => {
		try {
			//创建socket
			const socket = dgram.createSocket('udp4')
			socket.once('error', err => {
				clear()
				resolve(null)
			})
			//设置广播
			await new Promise<void>(resolve => {
				socket.bind({ address: '0.0.0.0' }, function () {
					socket.setBroadcast(true)
					resolve()
				})
			})
			//发送广播消息
			const send = () => socket.send(data, SERVER_UDP_PORT, (err, bytes) => {
				if (err) console.log(err)
			})
			//定时发送消息，并记录次数
			let count = 0
			send()
			const timer = setInterval(() => {
				send()
				count++
				//超过15秒退出
				if (count > 5) {
					clear()
					resolve(null)
				}
			}, 3000)		//每3秒发一次，直到收到响应
			//此函数用于清理
			const clear = () => {
				socket.close()
				clearInterval(timer)
			}
			//接受回复
			socket.on('message', msg => {
				//解析数据
				let data!: { type: string, data: any }
				try {
					data = JSON.parse(msg + '')
				} catch (err) {
					return
				}
				//检测地址
				if (data.type == 'address') {
					//取得IP地址
					let address!: string
					if (data.data.bind == '0.0.0.0' || data.data.bind == '::') {
						const addresses = data.data.ips as Array<string>
						//和本地地址对比，得到可用IP
						const dict = os.networkInterfaces()
						const validIps = Object.keys(dict).map(key => {
							const ip = dict[key].filter(i => /^\d+\.\d+\.\d+\.\d+$/.test(i.address))?.[0]?.address ?? null
							if (!ip) return null
							//取前三位匹配
							return (addresses.some(addr => {
								const addr3 = addr.match(/^(\d+\.\d+\.\d+\.)\d+$/)
								const ip3 = ip.match(/^(\d+\.\d+\.\d+\.)\d+$/)
								if (addr3 && ip3 && addr3[1] == ip3[1]) return true
								return false
							})) ? ip : null
						}).filter(s => !!s) as Array<string>
						//就取第一个吧
						address = validIps[0]
					}
					else address = data.data.bind
					if (!address) return
					//完成
					clear()
					resolve(`http://${address}:${data.data.listen}`)
				}
			})
		} catch (err) {
			resolve(null)
		}

	})
}

//完成退出
function discovered(addr: string) {
	if (addr) {
		const conf = commonApi.appdata.getNetworkAddress()
		commonApi.appdata.setNetworkAddress({ current: addr, addresses: conf?.addresses ?? [] })
	}
	electron.ipcRenderer.send('discover.done', addr)
}

const discoverApi = { getAddress, discovered }

electron.contextBridge.exposeInMainWorld('discoverApi', discoverApi)
electron.contextBridge.exposeInMainWorld('nativeApi', { ...commonApi })