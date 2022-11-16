<script setup>
  import axios from 'axios';
  import { ref, reactive } from 'vue';
  const newResponse2 = ref({});
  const newResponseStatus2 = ref({});
  const deleteRequest = reactive({
    collectionid: '',
    password: '',
    deleteentirecollection: '',
  });
  function loadExample2() { 
    deleteRequest.collectionid = 'xxxxxxx';
    deleteRequest.password = 'Password1234';
    deleteRequest.deleteentirecollection = true;
  }
  function submitDeleteRequest() {
    axios({
      method: 'delete',
      url: `https://34.27.198.255/delete?collectionid=${deleteRequest.collectionid}&password=${deleteRequest.password}&deleteentirecollection=${deleteRequest.deleteentirecollection}`
    }).then(function (response) {
        newResponseStatus2.value = 'response1';
        newResponse2.value = JSON.stringify(response.data, null, 2);
        window.scrollTo(0, document.body.scrollHeight);
    }).catch( function (error) {
        console.log(error);
        newResponseStatus2.value = 'response2';
        newResponse2.value = JSON.stringify(error.request?.response, null, 2);
        window.scrollTo(0, document.body.scrollHeight);
    });
  }
</script>
<template>
    <div class="container2">
      <span class="c2label1">collectionid:</span>
      <span class="c2label2">password:</span>
      <span class="c2label3">deleteentirecollection:</span>
      <InputText class="c2input1" type="text" v-model="deleteRequest.collectionid" placeholder="The id of the collection"/>
      <InputText class="c2input2" type="text" v-model="deleteRequest.password" placeholder="the pass the collection was created with"/>
      <InputText class="c2input3" type="text" v-model="deleteRequest.deleteentirecollection" placeholder="just a confirmation, must be true"/>
      <div class="c2button1">
        <Button label="Submit" @click="submitDeleteRequest" />
        <Button label="Load example"  @click="loadExample2"/>
      </div>
    </div>
    <h3>response:</h3>
    <template v-if="Object.keys(newResponse2).length !== 0">
      <pre :class="newResponseStatus2">{{newResponse2}}</pre>
    </template>
</template>
<style>
.container2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr 1fr;
  gap: 10px 0px;
  grid-template-areas: 
    "c2label1 c2input1"
    "c2label2 c2input2"
    "c2label3 c2input3"
    "c2button1 .";
}
.c2label1 { grid-area: c2label1; }
.c2label2 { grid-area: c2label2; }
.c2label3 { grid-area: c2label3; }
.c2input1 { grid-area: c2input1;}
.c2input2 { grid-area: c2input2;}
.c2input3 { grid-area: c2input3;}
.c2button1 { grid-area: c2button1;}

.button1 { grid-area: button1; display: inline;}

.c2button1 > button:nth-of-type(2) {
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
pre {
    white-space: pre-wrap;       /* Since CSS 2.1 */
    white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
    white-space: -pre-wrap;      /* Opera 4-6 */
    white-space: -o-pre-wrap;    /* Opera 7 */
    word-wrap: break-word;       /* Internet Explorer 5.5+ */
}
</style>