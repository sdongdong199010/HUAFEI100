/*
 *bug说明：
 * input框中js添加的空格删不掉		已解决
 * 当里面文字不是13个时，提交订单和价格按钮中有active		已解决
 * 历史记录，最多5个		已解决
 * */

/*
 *难点说明：
 *第三个和第7个手机号码后要加空格，验证手机号码格式，以及使用当前号码获取后台数据时不能有空格
 * 解决方法：封装了一个函数，用于将手机号码的空格去掉，但是这里面要求当前输入框中的号码加空格必须是13位字符，因为是使用正则进行匹配的，如果不是13位，会匹配报错。	这里blur事件会触发验证手机号码的事件，而验证手机号码就会调用去空格的函数
 * 
 * */

$(function(){
	//定义一个用于判断手机号格式的正则
	var phone_REG = /^1[3|4|5|8][0-9]\d{4}\d{4}$/;
	var phoneOrderData = {};
	//绑定输入框内文字输入事件
	$("#phoneIpt").bind('input propertychange', function(){
		//获取当前input框内容
		var $ipt = $(this).val();
		//当输入的字符时3个或8个时，在当前输入框后面加上一个空格
		if($ipt.length==3){
			$(this).val($ipt + " ");
		}
		if($ipt.length==8){
			$(this).val($ipt +" ");
		}
		//清除历史记录
		$(".phone-tips").html("");
		//显示历史记录的ul标签
		$(".container .phone-tips ").show();
		//调用获取历史记录的函数
		getPhones($ipt);
		//当有历史号码时，添加清除按钮
		if($(".container .phone-tips li").length>0){
			$("<li class='clear-phones'>清除历史充值号码</li>").appendTo($(".container .phone-tips"));
			//当点击历史号码时，隐藏历史号码，并获取当前历史号吗的值，赋予到号码输入框中
			$(".container .phone-tips li").not(".clear-phones").click(function(){
				var liContent = $(this).html();
				$("#phoneIpt").val(liContent);
				$(".container .phone-tips ").hide();
				//调用判断是否是13位字符的函数 (因为多了两个空格)
				is13();
			})
			//当点击清除历史记录按钮时，清除历史记录
			$(".clear-phones").click(function(e){
				$(".container .phone-tips").html("");
				localStorage.removeItem("phones");
			})	
		}
		//调用判断是否是13位字符的函数
		is13();
		
	})

	//当点击退格时,自动删除字符串首尾的空格
	$(document).keydown(function(event){ 
		if(event.keyCode == 8 ){
			$("#phoneIpt").val($("#phoneIpt").val().trim());
		};
	});
	
	//当获取焦点时，显示清除按钮
	$("#phoneIpt").focus(function(){
		$(this).siblings("i").show().siblings("span").hide();
	})
	
	//当点击叉号时，清除前面input框中内容
	$(".phone i").click(function(e){
		$("#phoneIpt").val("");
	})
	
	//当点击立即充值按钮时，判断当有active时，将手机号码存到本地,并跳转到收银台
	$(".commit a").click(function(){
		if($(this).hasClass("active")){
			var $ipt = $("#phoneIpt").val();
			var phoneStr =localStorage.getItem("phones")?localStorage.getItem("phones"):"[]";
			var phoneArr = JSON.parse(phoneStr)
			//遍历数组，当数组中没有当前号码，就把该号码添加到本地中
			//默认不存在此号码
			var isExit = false;
			for(var key in phoneArr){
				if(phoneArr[key]==$ipt){
					//当存在时，isExit变为true，停止循环
					isExit=true;
					break;
				}
			}
			//当不存在将号码添加到本地中，先判断里面是否已有5条数据，如果有，就删除第一个数据
			if(!isExit){
				if(phoneArr.length==5){
					phoneArr.shift();
				}
				phoneArr.push($ipt);
				phoneStr = JSON.stringify(phoneArr);
				localStorage.setItem("phones",phoneStr);
			}
				//将数据传输到收银台，并跳转到收银台，具体参数查看接口文档
//				{
//				  "customerUserId": "blm_abc",
//				  "userPhone": "15921012345",
//				  "cardId": "1499399",
//				  "phone": "15921111111",
//				  "realPrice": 100,
//				  "price": 99.5,
//				  "isp": "移动",		//在isphone函数中定义,当获取会运营商就被添加进去
//				  "area": "上海"		//在isphone函数中定义,当获取会运营商就被添加进去
//				}
				
				var serverUrl = /^[\d]|localhost/.test(location.hostname) ? 'https://dev-api.otosaas.com': `${ location.origin }/api`;
				var $priceBox = nowKitBox();
				
				phoneOrderData.customerUserId = "blm_abc";
				phoneOrderData.userPhone = "15921012345";
				phoneOrderData.cardId = $priceBox.attr("id");
				phoneOrderData.phone = getInput();
				phoneOrderData.realPrice = parseInt($priceBox.find("h1").html());
				phoneOrderData.price = $priceBox.find("span").html();		
//				console.log(phoneOrderData);	
				$.ajax({
					type:"post",
					url: serverUrl+"/huafei/v1/order",
					data:phoneOrderData,
					async:true,
					ContentType:'application/json'
				}).then(function(reply){
					console.log('reply', reply)
					var id = reply.data.id;
					//正式
//					window.location = "http://jst.otosaas.com/cashier/" + id;
					//测试用
					window.location = "http://jst.test.otosaas.com/cashier/" + id;
				});
				
			
			//console.log(localStorage.getItem("phones"));
		}
	})
	
/************************************************下面是一些函数方法的封装**************************************************/
	//定义一个函数，用于获取当前input框中的内容，并取消空格
	function getInput(){
		var $ipt = $("#phoneIpt").val();
		//判断是否时13位字符，因为blur事件，也会触发isphone函数，就会调用这个方法，而如果不是13位的话，正则匹配就匹配不到数据，导致matches[1] 报错
		//上述判断可以直接改成是否匹配到数字,如果不是,就任意返回一个字符串,交给isphone中的phone_EXP进行匹配.
		var ipt_REP =  /^(\d{3})[\s](\d{4})[\s](\d{4})$/;
		var matches = ipt_REP.exec($ipt);
		if(matches){
			var newNum = matches[1] + matches[2] + matches[3];
			return newNum;
		}else{
			return false;
		}
	}
//	console.log(getInput())
	//定义一个函数用于随时获取本地中存储的手机号码，匹配对应字符串，成功后追加到输入框下面,用于匹配的字符串以形参形式传入
	function getPhones(str){
		var phoneStr = localStorage.getItem("phones");
		var phoneArr = JSON.parse(phoneStr);
		var str_REG = new RegExp("^" + str);
		for(var key in phoneArr){
//			console.log(phoneArr[key])
			if(str_REG.test(phoneArr[key])){
				$("<li>"+phoneArr[key]+"</li>").appendTo($(".container .phone-tips"));
			}
		}
	}
	
	//定义一个函数用于判断手机格式是否正确
	function isPhone(){
		//调用getInput函数,获取11位手机号码
		var $ipt = getInput();
		if(phone_REG.test($ipt)){	    //当手机格式正确时
			//调用一下getPhoneDate函数获取当前手机号码对应信息
			getPhoneDate();
		}else{
			//显示手机格式错误
			$(".phone h4").show();
		}
	}
	
	//判断输入框中是否是13个字符，并作出对应样式调整
	function is13(){
		var $ipt = $("#phoneIpt").val();
		//当输入13个字符后，自动检测手机格式
		if($ipt.length==13){
			isPhone();
			//取消blur事件
			$("#phoneIpt").unbind("blur");
		}else{
			//绑定blur事件，检测手机格式
			$("#phoneIpt").blur(function(){
				isPhone();
			});
			//取消价格表,提交订单上的active,将价格框变成---
			$(".price .kit-box").each(function(){
				$(this).removeClass("active");
			})
			$(".commit a").removeClass("active").siblings("h1").children().html("- - -");
		}
	}
	
	//定义一个函数，用于从后台获取价格，地址等信息
	function getPhoneDate(){
		var serverUrl = /^[\d]|localhost/.test(location.hostname) ? 'https://dev-api.otosaas.com': `${ location.origin }/api`;
		//console.log(serverUrl)
		//调用getInput函数,获取11位手机号码
		var $ipt = getInput();
		$.ajax({
			type:"get",
			url: serverUrl + "/huafei/v1/" + $ipt + "/prices",
			async:true
		}).then(function(e){
//			console.log(e)
			//数据访问成功后,将话费价格动态添加到.price的价格框中,要先清除默认的价格
			$(".container .price").html("");
			var prices = e.data.list;
			for(var key in prices){
				var price = prices[key].price;
				var realPrice = prices[key].realPrice;
				$('<li class="col-xs-4">'+
					'<div class="kit-box"id="'+ prices[key].id +'">'+
						'<h1>'+ realPrice +'元</h1>'+
						'<p>仅售¥<span>'+ price +'</span>元</p>'+
					'</div>'+
				'</li>').appendTo($(".container .price"))
			}
			//将归属地和运营商添加到number下的span
			var area = e.data.area + e.data.isp;
			//隐藏清除按钮，显示供应商，隐藏手机格式错误
			$("#phoneIpt").siblings("i").hide().siblings("span").html(area).show().parent().siblings().hide();
			//充值金额添加active
			 $(".price li:first-child .kit-box").addClass("active");
			//给金额的li标签绑定点击事件，增加active，并改变尾部显示的价格
			$(".price li .kit-box").click(function(){
				$(this).addClass("active").parent().siblings().children(".kit-box").removeClass("active");
				//同步显示价格，调用nowPrice()获取当前价格
				$(".commit span").html(nowPrice());
			})
			//显示当前的选中的金额
			$(".commit span").html(nowPrice());
			//提交按钮添加active
			$(".commit a").addClass("active");
			
			//定义订单数据phoneOrderData的区域和运营商
			phoneOrderData.isp = e.data.isp;
			phoneOrderData.area = e.data.area;
		});
	}
	
	//定义一个函数，用于定义当前显示的充值价格
	function nowPrice(){
		var price = nowKitBox().find("span").html();
		return price;
	}
	//定义一个函数,用于获取当前激活的kit-box的jquery对象
	function nowKitBox(){
		var $kitBox = null;
		$(".price li").each(function(){
			if($(this).children(".kit-box").hasClass("active")){
				$kitBox = $(this).children(".kit-box");
				return false;
			}
		})
		return $kitBox;
	}
	 
})
