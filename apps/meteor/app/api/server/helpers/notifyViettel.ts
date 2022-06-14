import https from 'https';

const notifyConfig = {
	"vt.notify.url": "https://10.60.133.47:8282/notify/api-ver2/send",
	"vt.notify.appCode": "PMND_VPTD",
	"vt.notify.appPass": "73bddedd-1754-4166-bd6d-0122d31033a9",
	"vt.email.apiKey": "f062eed3-7e28-470e-a580-7133cda3e42d"
}

export enum CHANNEL_TYPE {
	SMS,
	MAIL,
	VIETTELFAMILY
}

class Receiver {
	type: String;
	value: String[];

	constructor(type, value) {
		this.type = type;
		this.value = value;
	}
}

class Channel {
	private type: String;
	private template: String;
	private alias: String;
	private subject: String;
	private title: String;
	private message: String;
	private data: String;

	get _type(): String {
		return this.type;
	}

	set _type(value: String) {
		this.type = value;
	}

	get _template(): String {
		return this.template;
	}

	set _template(value: String) {
		this.template = value;
	}

	get _alias(): String {
		return this.alias;
	}

	set _alias(value: String) {
		this.alias = value;
	}

	get _subject(): String {
		return this.subject;
	}

	set _subject(value: String) {
		this.subject = value;
	}

	get _title(): String {
		return this.title;
	}

	set _title(value: String) {
		this.title = value;
	}

	get _message(): String {
		return this.message;
	}

	set _message(value: String) {
		this.message = value;
	}

	get _data(): String {
		return this.data;
	}

	set _data(value: String) {
		this.data = value;
	}
}

const createChannelList = (channelType: CHANNEL_TYPE, title, message) => {
	let channelList: Channel[] = [];
	let channel: Channel = new Channel();

	switch (channelType) {
		case CHANNEL_TYPE.SMS:
			channel._type = "sms";
			channel._alias = title;
			channel._template = message;
			break;
		case CHANNEL_TYPE.MAIL:
			channel._type = "mail";
			channel._subject = title;
			channel._template = message;
			break;
		case CHANNEL_TYPE.VIETTELFAMILY:
			channel._type = "viettelfamily";
			channel._title = title;
			channel._message = message;
			break;

	}

	channelList.push(channel);
	return channelList;
}

const sendNotifyToUsers = (listUser, channelType: CHANNEL_TYPE, title: String, message: String) => {
	let receiverList: Receiver[] = [];
	receiverList.push(new Receiver("employeeCode", listUser));

	let channelList = createChannelList(channelType, title, message);

	let headers = {}, body = {};
	headers['X-Gravitee-Api-Key'] = notifyConfig['vt.notify.appPass'];
	headers['Content-Type'] = 'application/json';

	body['appCode'] = notifyConfig['vt.notify.appCode'];
	body['appPass'] = notifyConfig['vt.notify.appPass'];
	body['receivers'] = receiverList;
	body['channels'] = channelList;

	fetch(
		notifyConfig['vt.notify.url'],
		{
			method: 'POST',
			headers: headers,
			body: JSON.stringify(body),
			agent: new https.Agent({
				rejectUnauthorized: false,
			})
		}
	)
		.then(res => res.json())
		.then(data => console.log("------------------" + JSON.stringify(data) + "---------------------"))
		.catch(e => console.log("##########" + e.toString()))

}


export const sendNotify = sendNotifyToUsers;

