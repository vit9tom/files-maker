// // This file is required by the index.html file and will
// // be executed in the renderer process for that window.
// // All of the Node.js APIs are available in this process.

function makeFiles(filename) {
	let currentOffer = document.getElementById("offer_id").value;
	let isForeign = false;
	let isForeignInput = document.querySelector('input[id="foreign"]');
	if (isForeignInput.checked) {isForeign = true};
	let price = document.getElementById("price").value;

	let oldprice = price * 2;

	let foreign = '';
	if (isForeign) {
		foreign = ', "us"';
	}

	let requireContent = `<?php
	    require "/var/www/online-shop2019/data/www/online-shop2019.ru/leadtrade.php";
	    $offer_id  = ${currentOffer}; 
	    $land = new \\lt\\Landing($offer_id${foreign});
	    $validData = $land->getUserData();

	?>
	`

	let fileContent = fs.readFileSync(filename, "utf8");


	let headPos = fileContent.indexOf('</head>');
	let beforeHead = fileContent.slice(0, headPos);

	let ltScripts = `			<script type="text/javascript" src="http://online-shop2019.ru/static/js/jquery.min.js"></script>
	        				<script type="text/javascript" src="http://online-shop2019.ru/static/js/lt_landing_valid_form.js"></script>
	        				<script type="text/javascript" src="http://online-shop2019.ru/static/js/lt_landing_script.js"></script>
	        				<script type="text/javascript">
	          					$jsonData = <?php echo json_encode($land->getJsonData()); ?>
	        				</script>
							
	`

	let afterHead = fileContent.slice(headPos, fileContent.length);


	let afterForm = afterHead;
	let contentMassive = [];
	let beforeForm = '';

	/* Делим документ на до формы, формы и после, заносим эти куски кода в массив */

	while (afterForm.indexOf('<form') >= 0) {
	    formPos = afterForm.indexOf('<form');
	    beforeForm = afterForm.slice(0, formPos);

	    contentMassive.push(beforeForm);
	    afterForm = afterForm.slice(formPos, afterForm.length);

	    formEndPos = afterForm.indexOf('</form');
	    formInner = beforeForm = afterForm.slice(0, formEndPos);

	    contentMassive.push(formInner);
	    afterForm = afterForm.slice(formEndPos, afterForm.length);

	    if (afterForm.indexOf('<form') < 0) {
	        contentMassive.push(afterForm);
	    }
	}

	/* Все формы находятся по нечётным индексам. Достаём их и обрабатываем */

	let reoladerStart = `
			  <div class="reolader">
				<input type="submit" value="Заказать" class="mm_button `;
	let reoladerEnd = `" onclick="checkFields(event, this);">
				<div class="ajax_loader_block">
					<img class="ajax_loader" src="/img/ajax-loader.gif" alt="Идет отправка данных"> 
					<span class="ajax_loader">Идет отправка данных</span>
				</div>
			  </div`		  

	for (var i = 0; i < contentMassive.length; i++) {
	    if(i % 2 === 1) {
	        s = contentMassive[i]; // это форма в виде строки

	        let indexOfClass = s.indexOf('class');
	        let checkString = s.substr(indexOfClass, 10);
	        let symbol = undefined;

	        if (checkString.includes('"')) {
	            symbol = '"';
	        } else if (checkString.includes("'")) {
	            symbol = "'";
	        }

	        let formClassStart = s.indexOf(symbol, indexOfClass);
	        let r = formClassStart + 1;
	        let formClassEnd = s.indexOf(symbol, r);
	        let formClasses = s.slice(r, formClassEnd); // извлекаем классы

	        let formTagEnd = s.indexOf('>', 2);
	        let newTag = '<form action="/success/" method="post" class="' + formClasses + '">';

	        let indexTagEnd = s.indexOf('>');
	        let o = indexTagEnd + 1;
	        let formWithoutTag = s.slice(o);

	        let select = '	<select name="country" class="countryselect"><?php echo $land->htmlCountriesOptions(); ?></select>';

	        /* Делаем массив с тегами */

	        let formTagsArray = formWithoutTag.split('>');
	        let formWithoutHiddenArray = [];
	        formTagsArray.forEach(function(item){
	        	if (!item.includes('hidden')) {
	        		formWithoutHiddenArray.push(item);
	        	}
	        });
	        

	        let newFormArray = formWithoutHiddenArray.map(function(item){
	        	if (item.includes(' name')) {
	        		let indexOfName = item.indexOf('name');
	        		let checkString = item.substr(indexOfName, 8);
	        		let symbol = undefined;

	        		if (checkString.includes('"')) {
	        		    symbol = '"';
	        		} else if (checkString.includes("'")) {
	        		    symbol = "'";
	        		}

	        		let inputNameStart = item.indexOf(symbol, indexOfName);
	        		let r = inputNameStart + 1;
	        		let inputNameEnd = item.indexOf(symbol, r);
	        		let inputName = item.slice(r, inputNameEnd); // извлекаем name

	        		let afterNameIndex = inputNameEnd + 1;

	        		let inputBeforeName = item.slice(0, r);
	        		let inputAfterName = item.slice(afterNameIndex);
	        		let nameInner = '';
	        		let phpCode = ''

	        		if (inputName.includes('name')||inputName.toLowerCase().includes('fio')) {
	        			nameInner = 'name"';
	        			phpCode = ' value="<?php echo $validData[\'name\']; ?>"'
	        		} else {
	        			nameInner = 'phone"';
	        			phpCode = ' value="<?php echo $validData[\'phone\']; ?>"'
	        		}

	        		return inputBeforeName + nameInner + phpCode + inputAfterName;
	        	} else if (item.includes('submit')&!item.includes('<button')) {
	        		let indexOfClass = item.indexOf('class');
	        		let checkString = item.substr(indexOfClass, 10);
	        		let symbol = undefined;

	        		if (checkString.includes('"')) {
	        		    symbol = '"';
	        		} else if (checkString.includes("'")) {
	        		    symbol = "'";
	        		}

	        		let submitClassStart = item.indexOf(symbol, indexOfClass);
	        		let r = submitClassStart + 1;
	        		let submitClassEnd = item.indexOf(symbol, r);
	        		let submitClasses = item.slice(r, submitClassEnd); // извлекаем классы

					return reoladerStart + submitClasses + reoladerEnd;
	        	} else {
	        		return item;
	        	}
	        });

	        let indexOfButton = newFormArray.findIndex(item => item.includes('<button'));
	        if (indexOfButton !== -1) {
	        	let indexOfButtonClose = newFormArray.findIndex(item => item.includes('</button'));
	        	let spliceCount = indexOfButtonClose - indexOfButton + 1;

	        	let buttonTag = newFormArray[indexOfButton];

	        	indexOfClass = buttonTag.indexOf('class');
	        	checkString = buttonTag.substr(indexOfClass, 10);
	        	symbol = undefined;

	        	if (checkString.includes('"')) {
	        	    symbol = '"';
	        	} else if (checkString.includes("'")) {
	        	    symbol = "'";
	        	}

	        	let buttonClassStart = buttonTag.indexOf(symbol, indexOfClass);
	        	r = buttonClassStart + 1;
	        	let buttonClassEnd = buttonTag.indexOf(symbol, r);
	        	let buttonClasses = buttonTag.slice(r, buttonClassEnd); // извлекаем классы

	        	let reolader = reoladerStart + buttonClasses + reoladerEnd;
	        	newFormArray.splice(indexOfButton, spliceCount, reolader);
	        }
	        
	        
	        let hiddenInputs = `
	        			<input type="hidden" name="productsum" value="${price} руб." />
		
						<input type="hidden" name="delivery" value="0 руб." />
		
						<input type="hidden" name="totalsum" value="${price} руб." />
		
						<input type="hidden" name="user" value="1" />
		
						<input type="hidden" name="address" value="Уточнить у покупателя" />`;
	        let newForm = newTag + '\n' + select + newFormArray.join('>') + hiddenInputs;
	        
	        contentMassive[i] = newForm;
	    }
	}


	/* Склеиваем и записываем */
	afterHead = contentMassive.join('');
	let output = requireContent + beforeHead + ltScripts + afterHead;

	// Убираем дублирование руб. (не учитывает другие валюты)

	let tagsArray = output.split('>');

	tagsArray.forEach(function(item){
		let i = tagsArray.indexOf(item);
		let checkString = item.substr(0, 8);
		if (checkString.includes('руб')||checkString.includes('р<')||checkString.includes('р.')||checkString.includes('р ')) {
			let currEndIndex = item.indexOf('<');
			let tagWithoutCurr = item.slice(currEndIndex);
			tagsArray[i] = tagWithoutCurr;	
		}
	});

	output = tagsArray.join('>');

	// Указываем путь

	let myPath = filename + "/../index.php";
	fs.writeFileSync(myPath, output);
	
	/* Делаем success */

	let success = `<?php require "/var/www/online-shop2019/data/www/online-shop2019.ru/leadtrade.php";

					$offer_id  = ${currentOffer};
					$land = new \\lt\\Landing($offer_id${foreign});

					$land->success();`
	let successPath = filename + "/../success";
	if (!fs.existsSync(successPath)){
	    fs.mkdirSync(successPath);
	}
	let successFilePath = filename + "/../success/index.php";
	fs.writeFileSync(successFilePath, success);
	alert('done');
}