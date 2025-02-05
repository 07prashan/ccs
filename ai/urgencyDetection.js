const natural = require('natural');
const aposToLexForm = require('apos-to-lex-form');
const SpellCorrector = require('spelling-corrector');
const SW = require('stopword');

const spellCorrector = new SpellCorrector();
spellCorrector.loadDictionary();

class UrgencyDetector {
    constructor() {
        this.classifier = new natural.BayesClassifier();
        this.initializeClassifier();
    }

    initializeClassifier() {
        // Training data for critical urgency
        const criticalUrgencyComplaints = [
            "house has caught fire urgent help needed",
            "building collapsing firefighters required immediately",
            "massive flood rescue operation required immediately",
            "severe gas leak emergency evacuate building",
            "live electrical wire down in public area",
            "major explosion imminent danger",
            "massive earthquake severe building damages",
            "toxic chemical spill evacuation required",
            "train crash immediate medical help needed",
            "fire outbreak causing severe damage"
        ];

        // Training data for high urgency
        const highUrgencyComplaints = [
            "water pipe burst flooding street massive water waste",
            "live electrical wire hanging dangerously",
            "bridge structure seems damaged and unsafe",
            "major sewage overflow in residential area",
            "road cave in dangerous for vehicles",
            "gas leak strong smell",
            "building wall about to collapse",
            "fire hazard electrical short circuit",
            "drinking water contaminated many sick",
            "traffic signals not working major intersection"
        ];

        // Training data for medium urgency
        const mediumUrgencyComplaints = [
            "garbage not collected for a week bad smell",
            "street light not working for days",
            "water supply irregular",
            "road has many potholes",
            "drainage system blocked",
            "public toilet needs maintenance",
            "park equipment broken",
            "noise pollution from construction",
            "illegal parking causing inconvenience",
            "stray animals creating problems"
        ];

        // Training data for low urgency
        const lowUrgencyComplaints = [
            "park needs cleaning",
            "street name board missing",
            "tree branches need trimming",
            "wall needs repainting",
            "playground equipment rusty",
            "street light flickering",
            "bench in park broken",
            "garbage bin needs replacement",
            "sidewalk needs minor repairs",
            "graffiti on public wall"
        ];

        // Train the classifier
        criticalUrgencyComplaints.forEach(complaint => {
            this.classifier.addDocument(this.preprocessText(complaint), 'critical');
        });

        highUrgencyComplaints.forEach(complaint => {
            this.classifier.addDocument(this.preprocessText(complaint), 'high');
        });

        mediumUrgencyComplaints.forEach(complaint => {
            this.classifier.addDocument(this.preprocessText(complaint), 'medium');
        });

        lowUrgencyComplaints.forEach(complaint => {
            this.classifier.addDocument(this.preprocessText(complaint), 'low');
        });

        this.classifier.train();
    }

    preprocessText(text) {
        // Convert contractions to standard lexicon
        const lexedText = aposToLexForm(text);

        // Convert to lowercase
        const lowercasedText = lexedText.toLowerCase();

        // Remove special characters and numbers
        const alphaOnlyText = lowercasedText.replace(/[^a-zA-Z\s]+/g, '');

        // Tokenize the text
        const tokenizedText = alphaOnlyText.split(' ');

        // Correct spelling
        const spelledText = tokenizedText.map(word => spellCorrector.correct(word));

        // Remove stopwords
        const filteredText = SW.removeStopwords(spelledText);

        return filteredText.join(' ');
    }

    getUrgencyLevel(complaintText) {
        const processedText = this.preprocessText(complaintText);
        const classification = this.classifier.classify(processedText);
        const urgencyDetails = this.getUrgencyDetails(classification);

        return {
            level: classification,
            ...urgencyDetails
        };
    }

    getUrgencyDetails(level) {
        const details = {
            critical: {
                priority: 1,
                responseTime: 'Immediate',
                color: '#FF0000',
                description: 'Requires urgent action due to severe consequences. Poses immediate risk to public safety or infrastructure.'
            },
            high: {
                priority: 2,
                responseTime: 'Within hours',
                color: '#FF4500',
                description: 'Immediate attention required. Poses risk to public safety or infrastructure.'
            },
            medium: {
                priority: 3,
                responseTime: '72 hours',
                color: '#FFA500',
                description: 'Significant issue requiring attention within standard timeframe.'
            },
            low: {
                priority: 4,
                responseTime: '7 days',
                color: '#008000',
                description: 'Minor issue that should be addressed when resources are available.'
            }
        };

        return details[level];
    }
}

module.exports = UrgencyDetector;
