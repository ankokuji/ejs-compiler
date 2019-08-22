import { compile } from "./index";
const fn = compile(`<% for (let i= 0; i<user.length; i++) {%>
  <h2><%= user[i].name %></h2>
  <% } %>
`);

const str = fn({ user: [{ name: "5342" }, {name: '325'}] });
