/// <reference path="typings/index.d.ts" />
import IThenable = Promise.IThenable;
let Prom = require('promise');
let fs = require('fs');
let _ = require('underscore');
let path = require('path');
let moment = require('moment');

let log = console.log;
console.log = function(...arguments2: Array<any>) {
	let datePlus = [moment().format('HH:m:s.SS')].concat(arguments2);
	log.apply(console, datePlus);
};

declare interface BookChapter {
	title: string,
	data: string,
}

/**
 * http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
 * @param sleepDuration
 */
function sleepFor( sleepDuration ){
	let now = new Date().getTime();
	while (new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

class Run {

	Epub = require("epub-gen");

	links = [
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

	sequence() {
		let p = this.sequence1();
		console.log('p', p);

		p.then((hello) => {
			return this.sequence2(hello);
		}).catch(err => {
			console.log('Promise error');
			console.log(err);
		}).done((value) => {
			console.log('value', value);
		});
	}

	sequence1() {
		return new Prom((resolve) => {
			console.log('step 1', typeof resolve);
			sleepFor(10);
			///return 'step 1 after sleep';
			//resolve('1 second');	// done value
			resolve('hello ');				// next step
			// return 'hello';
		});
	}

	sequence2(hello) {
		return new Prom(resolve => {
			console.log('step 2', typeof resolve);
			sleepFor(10);
			//return 'step 2 after sleep';
			resolve(hello + '2 seconds');
		});
	}

	test() {
		let converter = new this.Epub({
			title: 'Питер Тиль - Стартап',
			content: [
				{
					title: 'Chapter 1',
					data: 'bla-bla',
				},
				{
					title: 'Chapter 2',
					data: 'bla-bla 2 times',
				},
			],
			output: './test.epub',
		}).promise.then(function (result) {
			console.log("Ebook Generated Successfully!");
			console.log('result', result);
		}, function (err) {
			console.error("Failed to generate Ebook because of ", err)
		});
		return converter.then((value) => {
			console.log('converter is done');
			console.log('value', value);
		}).catch(function(e) {
			console.log(e); // "oh, no!"
		});
	}

	convert() {
		let bookPromise = this.getContent();
		console.log('bookPromise', bookPromise);
		return bookPromise.then((book, resolve) => {
			console.log('bookPromise passed', book.length);
			console.log('resolve', resolve);

			let bookSimplified = [];
			book.forEach((chapter, i) => {
				let chapter2 = _.clone(chapter);
				chapter2.data = '<string>[' + chapter2.data.length + ']';
				console.log(chapter2);
				bookSimplified.push(chapter2);
			});
			return bookSimplified;
		}).then(bookSimplified => {
			let converter = new this.Epub({
				title: 'Питер Тиль - Стартап',
				content: bookSimplified,
				output: './0to1.epub',
			}).promise.then(function (result) {
				console.log("Ebook Generated Successfully!")
			}, function (err) {
				console.error("Failed to generate Ebook because of ", err)
			});
			console.log('converter', converter);
			return converter;
		}).then(() => {
			console.log('convert done');
		});
	}

	getContent() {
		let book = [];
		let done = _.reduce(this.links, (pacc: IThenable<string>, url: string) => {
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
r.sequence();

r.test()
	.then((afterTest) => {
		console.log('afterTest', afterTest);
		return r.convert();
	})
	.then(done => {
		console.log('main done', done);
	});

// r.convert();
