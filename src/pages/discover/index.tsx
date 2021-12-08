import './index.scss'
import { Loading } from "../../components/loading";
import { Page } from "../../libs/page";
import { apis } from '../../api';
import { createTip } from '../../components/popover';

interface IDiscoverPageState {
	loading: boolean
	loadingText: string
	address: string
}

export class DiscoverPage extends Page<{}, IDiscoverPageState> {

	private discoverApi = (window as any).discoverApi

	constructor(props: any) {
		super(props)
		this.state = { loading: false, loadingText: '', address: '' }
	}

	async componentDidMount() {
		this.setState({ loading: true, loadingText: '正在查询' })
		await new Promise(resolve => setTimeout(resolve, 1000))
		const address = await this.discoverApi.getAddress()
		//看看是否获取到了地址，获取到了ping一下
		if (address) this.setState({ address }, this.handlePing.bind(this))
		else {
			createTip('没有发现可用服务器', 'error')
			this.setState({ loading: false })
		}
	}

	private async handlePing() {
		const address = this.state.address
		if (!/^https?:\/\//.test(address)) return
		this.setState({ loading: true, loadingText: '正在校验' })
		await new Promise(resolve => setTimeout(resolve, 1000))
		const pong = await nativeApi.request.get(`${address.replace(/\/+$/, '')}/api/sys/ping`, { type: 'json5' }).catch(err => '')
		//查看是否ping成功，ping成功则退出，否则进行输入
		if (pong == 'pong') this.discoverApi.discovered(address)
		else {
			createTip('尝试链接失败', 'error')
			this.setState({ loading: false })
		}
	}

	render() {
		const { loading, loadingText, address } = this.state
		return (
			<div id="discover-page">
				{/* 查找中 */}
				{loading ? <div className="finding">
					<Loading />
					<div>{loadingText}</div>
				</div> : null}
				{/* 手动输入 */}
				{loading ? null : <div className="input-address">
					<form onSubmit={e => {
						e.preventDefault()
						this.handlePing()
					}}>
						<div className="input-item">
							<input type="text" value={address} onChange={e => this.setState({ address: e.target.value })} placeholder="请输入服务器地址，例如：http://192.168.10.101:3801" />
							<div className="btn" onClick={e => this.handlePing()}>检测</div>
						</div>
					</form>
				</div>}
				{/* 关闭 */}
				<div className="title-bar">
					<div className="flex"></div>
					<div className="close-btn" onClick={() => this.discoverApi.discovered(null)}>
						<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
							<path d="M572.16 512l183.467-183.04a42.667 42.667 0 1 0-60.587-60.587L512 451.84 328.96 268.373a42.667 42.667 0 0 0-60.587 60.587L451.84 512 268.373 695.04a42.667 42.667 0 0 0 0 60.587 42.667 42.667 0 0 0 60.587 0L512 572.16l183.04 183.467a42.667 42.667 0 0 0 60.587 0 42.667 42.667 0 0 0 0-60.587z"></path>
						</svg>
					</div>
				</div>
			</div>
		)
	}
}