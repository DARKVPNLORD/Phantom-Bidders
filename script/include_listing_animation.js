/**
 * Include listing animation HTML on page load
 * This script will fetch and insert the listing animation HTML
 * into any page that includes this script
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create a fetch request to get the listing animation HTML
    fetch('../html/shared/listing_animation.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load listing animation HTML');
            }
            return response.text();
        })
        .then(html => {
            // Create a temporary container
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = html.trim();
            
            // Append the content to the body
            document.body.appendChild(tempContainer.firstChild);
            
            // Add the CSS if not already included
            if (!document.querySelector('link[href="../css/listing_animation.css"]')) {
                const linkElement = document.createElement('link');
                linkElement.rel = 'stylesheet';
                linkElement.href = '../css/listing_animation.css';
                document.head.appendChild(linkElement);
            }
        })
        .catch(error => {
            console.error('Error loading listing animation:', error);
        });
}); 