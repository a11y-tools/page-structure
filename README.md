# Page Structure: Browser Extension for Firefox

## Summary

Utilize the Firefox Sidebar to display the structural labels on a web page, including its page title, headings, and landmarks, for web accessibility evaluation.

## Description

The Page Structure extension can help you determine whether a web page meets the accessibility requirements for Page Structure, as defined in the <a href="https://www.w3.org/TR/WCAG21/">Web Content Accessibility Guidelines (WCAG) 2.1</a> and <a href="https://www.w3.org/TR/wai-aria-1.2/"> Accessible Rich Internet Applications (WAI-ARIA) 1.2</a> specifications, by displaying the following structural information:

<ul>
<li><strong>Page Title</strong>: Does the title adequately describe the page, i.e. its purpose or main content?</li>

<li><strong>Headings</strong>: Are HTML headings used (h1 ... h6) to break down the content into sections and subsections? Do they indicate the hierarchical structure of the content? Users of screen reader software rely on its header navigation functionality, and Page Structure can help you determine whether the list of headings it provides will be adequate for finding content on the page, in terms of both proper structure and clear labeling.</li>

<li><strong>Landmarks</strong>: Are ARIA landmarks used properly to demarcate regions on the page such as main, navigation, banner, footer and contentinfo? Landmarks are important for screen reader users, among others, for skipping from one major region to another on a page. Also, when there are multiple occurrences of the same type of landmark, does each one have a unique label?</li>
</ul>

For examining large pages, the extension enables you to select a heading or landmark and then highlight and scroll to it on the page. Headings are highlighted with an orange outline, and landmarks use a dark blue outline. In an upcoming version, you will be able to customize the highlight colors.
