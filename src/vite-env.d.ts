declare module '*.tsx' {
	const content: any;
	export default content;
}

declare module '*.png' {
	const content: string;
	export default content;
}

declare module '*.jpg' {
	const content: string;
	export default content;
}

declare module 'electron' {
	const electron: any;
	export = electron;
}
