<script setup>
  import axios from 'axios';
  import { ref, reactive } from 'vue';
  const newRequest = reactive({
    collectionid: '',
    document: '',
  });
  const newResponse = ref({});
  const newResponseStatus = ref({});

  function loadExample() {
    newRequest.collectionid = 'xxxxxx';
    newRequest.document = JSON.stringify({
        foo: ["foo", "bar", "baz"],
        bar: "bar",
        fooo: 1,
        bax: true,
        baz: { foo: "foo", bar: "bar" }
    }, null, 2);
  }
  function submitRequest() {
    axios({
        method: 'post',
        url: `https://34.27.198.255/insert?collectionid=${newRequest.collectionid}`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: newRequest.document
    }).then( function (response) {
        newResponseStatus.value = 'response1';
        newResponse.value = JSON.stringify(response.data, null, 2);
        window.scrollTo(0, document.body.scrollHeight);
    }).catch( function (error) {
        console.log(error); 
        newResponseStatus.value = 'response2';
        newResponse.value = JSON.stringify(error.request?.response, null, 2);
        window.scrollTo(0, document.body.scrollHeight);
    });
  }

</script>

<template>

<div class="container">
  <span class="c3label1">collectionid:</span>
  <InputText class="c3input1" type="text" v-model="newRequest.collectionid" placeholder="The collection id"/>

  <span class="c3label3">document</span>
  <Textarea class="c3input3" :autoResize="false" v-model="newRequest.document" rows="1" cols="30" placeholder="document to be inserted"/>

  <div class="c3button1">
    <Button label="Submit" @click="submitRequest"/>
    <Button label="Load example" @click="loadExample" />
  </div>
</div>

  <h3>http raw request:</h3>
  <template v-if="newRequest.collectionid">
    <div>POST http://microdb.fredy.dev/delete?collectionid={{newRequest.collectionid}}<span>&password={{newRequest.password}}</span> HTTP/1.1</div>
    Content-Type: application/json<br>
    <pre>{{newRequest.document}}</pre>
  </template>
  <h3>response:</h3>
  <template v-if="Object.keys(newResponse).length !== 0">
    <pre :class="newResponseStatus">{{newResponse}}</pre>
  </template>
</template>

<style scoped>
.container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 140px 1fr;
    gap: 10px 0px;
}
.c3button1 > button:nth-of-type(2) {
    margin-left: 10px;
}
.response1 {
  background-color: rgba(0, 128, 0, 0.123);
  padding: 10px;
}
.response2 {
  background-color: rgba(128, 0, 0, 0.123);
  padding: 10px;
  word-wrap: break-word;
}
</style>