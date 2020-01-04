var conf = {
	//copied from http://www.supermemo.com/articles/paper.htm
	intervals: [
		0,		//initial memorization
		4,		//4 days
		7,		//7 days
		12,		//12 days
		20,		//20 days
		30,		//1 month
		60,		//2 months
		90,		//3 months
		150,	//5 month
		270,	//9 months
		480,	//16 months
		720,	//2 years
		1440,	//4 years
		2160,	//6 years
		3960,	//11 years
		6480	//18 years
	],
	millsec: {
		day: 1000 * 60 * 60 * 24,
		sec: 1000,
		min: 1000 * 60,
		hour: 1000 * 60 * 60
	}
};
