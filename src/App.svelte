<script>
	let name = 'name';
	let altText = 'Rich Harris';
	let src = 'https://images.app.goo.gl/RRtDjhEwXDPSJyRaA';
	let number = 42;
	let htmlString = "<b>This is strong text</b> with <em>italic text</em>";
	let pos = {
	    x : 0,
	    y : 0
	}
	let inputValue = 'input';


	function changeName() {
        name = 'Changed name';
	}
	function mousemoveHandler(event) {
	    pos.x = event.x;
	    pos.y = event.y;
	}
	function submitHandler(event) {
        // event.preventDefault для остановки
        event.preventDefault()
        console.log(inputValue)
	}


	///////////////////////////// lesson 2


	let name2 = "svelte"
    let counter = 0;

    $: counterClass = counter % 2 === 0 ? "red" : "blue"
    $: upperName = name.toUpperCase();
    $: lowerName = name.toLowerCase();

    $: {
        console.log("Name", name2)
        console.log("Counter", counter)
    }

    $: if (counter === 10) {
        name2 = "counter is equal 10"
    }

    function changeName2() {
        name = "New name";
    }


    ///////////////////////////// lesson 3
    let name3 = "svelte"
    let agree = false;
    let text = "";
    let select = "2";
    let sex = "male";

    ///////////////////////////// lesson 4

    let value4 = "Hello"
    $: error = !isValid(value4);

    function isValid(val) {
        return val.length > 5 && val.length < 10;
    }

    ///////////////////////////// lesson 5
    import Person from "./Person.svelte";

    let value5 = "";
    let people = [
        {id:1, name: "Максим"},
        {id:2, name: "Елена"},
        {id:3, name: "Татьяна"},
    ]


    function removeFirst() {
        people = people.slice(1);
    }

    function addPerson() {
        people = [
        ...people,
            {
                id: Date.now(),
                name: value5
            }
        ];
        value5 = "";
    };

</script>

<style>
	:global(h1) {
		color: purple;
	}
	img {
	    height: auto;
	    width: 100px;
	}

	.playground {
	    width: 400px;
	    height: 200px;
	    padding: 1rem;
	    margin-bottom: 1rem;
	    border: 1px solid black;
	}
	.blue {
	    color: blue
	}
    .red {
        color: red
    }
    input4 {
        outline: none;
    }
    .red4 {
        border-color: red
    }
    .green4 {
        border-color: green
    }

</style>

<h1>Hello {name}!</h1>
<h2>{name.toUpperCase()}</h2>
<h2>{(Math.random() * number).toFixed(3)}</h2>


<!-- src переменная как атрибут {...spread} можно использовать --> 
<img {src} alt={altText}>

<!-- вывод html -->
<p>{@html htmlString}</p>

<button on:click={changeName}>Change name</button>
<div class="playground" on:mousemove={mousemoveHandler}>
    <h2>x: {pos.x}, y: {pos.y}</h2>
</div>


<!-- модификаторы  on:submit|preventDefault-->
<form on:submit={submitHandler}>
    <input type="text" on:input={event => event.target.value}>
    <button type="submit">Submit form</button>
</form>


<!-- lesson2 -->

<h1>{name2}</h1>
<h1>{upperName}</h1>
<h1>{lowerName}</h1>

<button on:click={changeName2}> Change name </button>

<h1 class={counterClass}> Counter{counter}</h1>
<button on:click={() => counter++}>Add 1 to counter</button>

<!-- lesson3 -->
<h1>{name}</h1>
<input type="text" bind:value={name} />
<hr/>
<input type="checkbox" bind:checked={agree}/> {agree}
<hr/>
<textarea bind:value={text}/>
<div style="white-space: pre-wrap">{text}</div>
<hr/>
<select bind:value={select}>
    <option value="0">Option 0</option>
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
</select>
<hr />
<input type="radio" value="female" bind:group={sex}>Female
<input type="radio" value="male" bind:group={sex}>Male
<br/>
Sex: {sex}

<!-- lesson4 -->
<input type="text" bind:value={value4} class:red4={error} class:green={!error}>

{#if value4.length < 5}
    <p>длина меньше 5 символов</p>
{:else if value4.length > 10}
    <p>Длинна больше 10 символов</p>
{:else}
    <p>Длина между 5 и 10</p>
{/if}

<!-- lesson5 -->
<input type="text" bind:value={value5}>
<button on:click={addPerson}>Add person</button>
<button on:click={removeFirst}>Remove first</button>

<hr/>

{#each people as person, i (person.id)}
    <Person {...person} index={i}/>
{:else}
    <p>No people</p>
{/each}