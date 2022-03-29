This branch contains the code to scrape the real estate listings from the website https://www.newhome.ch/it/home . The latter has been chosen to be the ideal website in terms of the number of listings and house information.

Any house which is present in the portal and is distant less than 4 km from the centroid of the city will be scraped and gathered in the listings.csv file (currently at its version 4).

The framework used to conduct such scraping is Scrapy, a Python library.

In order to be able to launch a scraping session (though this cannot be autonoumsly done as the code contains API KEY which have been saved as environmental variables and not exposed to the GitHub Repository - please contact for further information) it is sufficient to launch the following command:

-- scrapy crawl ginevra-listings -o csv_name.csv

This command will save the crawled listings into the indicated csv file.

Here is a short description of some of the important files:

   * spider1.py is the main file where the parse_single_listing function parses the html to crawl the information of the listing
   * middleware.py contains the classes which enable Random User Agent Notation
   * settings.py is where all the setting variables are set, such as how the proxies are rotated, the download delay, and which middlewares are to be activated
