/// <reference path="typings/index.d.ts" />
import IThenable = Promise.IThenable;
let Prom = require('promise');
let fs = require('fs');
let _ = require('underscore');
let path = require('path');

declare interface BookChapter {
	title: string,
	data: string,
}

class Run {

	convert() {
		let bookPromise = this.getContent();
		bookPromise.then((book, resolve) => {
			console.log('bookPromise passed', book.length);
			console.log('resolve', resolve);
			let Epub = require("epub-gen");
			console.log(Epub);
			let converter = new Epub({
				title: 'Питер Тиль - Стартап',
				content: book,
				output: './test.epub',
			}).promise.then(function () {
				console.log("Ebook Generated Successfully!")
			}, function (err) {
				console.error("Failed to generate Ebook because of ", err)
			});
			console.log('converter', converter);
		}).then(() => {
			console.log('done');
		});
	}

	getContent() {
		let links = [
			"http://habrahabr.ru/post/152106/",
			"http://habrahabr.ru/post/155841/",
			"http://habrahabr.ru/post/156575/",
			"http://habrahabr.ru/post/158811/",
			"http://habrahabr.ru/post/159307/",
			"http://habrahabr.ru/post/161185/",
			"http://habrahabr.ru/post/161939/",
			"http://habrahabr.ru/post/170465/",
			"http://habrahabr.ru/post/171355/",
			"http://habrahabr.ru/post/181858/",
			"http://habrahabr.ru/post/185246/",
			"http://habrahabr.ru/post/185978/",
			"http://habrahabr.ru/post/187742/",
			"http://habrahabr.ru/post/188952/",
			"http://habrahabr.ru/post/190542/",
		];

		let book = [];
		let done = _.reduce(links, (pacc: IThenable<string>, url: string) => {
			console.log('reduce', pacc, url);
			return pacc.then((resolve) => {
				let filename = path.basename(url);
				if (!path.extname('url')) {
					filename += '.html';
				}
				console.log(filename, 'exists', fs.existsSync(filename));
				if (!fs.existsSync(filename)) {
					this.downloadFile(url, filename, book);
				} else {
					this.readFile(book, filename);
				}
			});
		}, new Prom.resolve());
		return done.then((resolve) => {
			console.log('book done', book.length);
			return book;
		});
	}

	private downloadFile(url: string, filename: string, book: Array<BookChapter>) {
		return this.downloadHTML(url).then((body: string) => {
			console.log('push chapter', filename);
			fs.writeFileSync(filename, body);
			book.push({
				title: 'Chapter 1',
				data: body,
			});
			console.log('book', book.length);
		});
	}

	private readFile(book: Array<BookChapter>, filename: string) {
		console.log('File exists. Reading...');
		return new Promise((resove, reject) => {
			book.push({
				title: 'Chapter 2',
				data: fs.readFileSync(filename),
			});
			console.log('book', book.length);
		});
	}

	downloadHTML(url) {
		let request = require('request');
		console.log(url);
		return new Promise((resolve, reject) => {
			request(url, function(error, response, body) {
				console.log('downloaded', body.length);
				resolve(body);
			});
		});
	}

}

let r = new Run();
r.convert();
